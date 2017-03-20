#include "tcp.h"
#include "uv.h"
#include <cstring>

namespace nodex{
    using v8::Local;
    using v8::Object;
    using v8::String;
    using v8::FunctionTemplate;
    using v8::Function;
    using v8::Value;

    //定义内部全局变量
    std::string responseList[32];
    int responseListLength = 0;
    Nan::Persistent<Function> TCP::func_p_tcp;
    Nan::Persistent<Function> TCP::constructor;
    //uv_async_t async;
    int socket_connect_fd = 0;

    //定义构造函数
    TCP::TCP (char* sa_, int sp_) {
        SERVER_ADDRESS_ = sa_;
        SERVER_PORT_ = sp_;
    }
    //定义析构函数
    TCP::~TCP () {}

    //定义挂载至V8对象的入口函数
    void TCP::Initialize(Local<Object> target){
        Nan::HandleScope scope;

        //构造函数模板
        Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
        tpl->SetClassName(Nan::New<String>("TCP").ToLocalChecked());
        tpl->InstanceTemplate()->SetInternalFieldCount(2);

        //设置函数的原型方法
        Nan::SetPrototypeMethod(tpl, "connect", TCP::Connect);
        Nan::SetPrototypeMethod(tpl, "sendMessage", TCP::SendMessage);
        Nan::SetPrototypeMethod(tpl, "receiveMessage", TCP::ReceiveMessage);
        Nan::SetPrototypeMethod(tpl, "getRecvMessageList", TCP::GetRecvMessageList);
        Nan::SetPrototypeMethod(tpl, "close", TCP::Close);

        //释放Persistent变量，给构造器对象赋值
        constructor.Reset(tpl->GetFunction());
        target->Set(Nan::New("TCP").ToLocalChecked(), tpl->GetFunction());
    }

    //1. 构造JS Class的构造函数
    void TCP::New(const Nan::FunctionCallbackInfo<Value>& info){
        //简单的参数校验, 参数个数必须大于等于2个
        int argumentLength = info.Length();
        if(argumentLength < 2){
            printf("构造函数默认参数必须大于等于2个！");
            info.GetReturnValue().Set(Nan::Undefined());
            return;
        }

        if (info.IsConstructCall()) {//new的构造器调用方式
            //获取服务器地址和端口号
            Nan::Utf8String serverIp_s(info[0]->ToString());
            int port = info[1]->ToInteger()->Value();

            //新建TCP类实例，绑定this对象并返回
            TCP* tcp = new TCP(*serverIp_s, port);
            tcp->Wrap(info.This());
            info.GetReturnValue().Set(info.This());
          } else {//普通函数调用形式
            //生成新的实例并返回
            const int argc = 2;
            Local<Value> argv[argc] = { info[0], info[1] };
            Local<Function> cons = Nan::New<Function>(constructor);
            //info.GetReturnValue().Set(cons->NewInstance(argc, argv));
            info.GetReturnValue().Set((Nan::NewInstance(cons, argc, argv)).ToLocalChecked());
        }
    }

    //2. 原型方法 — 连接到服务器
    void TCP::Connect(const Nan::FunctionCallbackInfo<Value>& info){
        TCP* tcp = ObjectWrap::Unwrap<TCP>(info.Holder());
        const char* serverIp = tcp->SERVER_ADDRESS_.c_str();
        int serverPort = tcp->SERVER_PORT_;

        tcp->tcli = new TcpClient();
        tcp->fdesc = tcp->tcli->TcpConnect(serverIp, serverPort);
        socket_connect_fd = tcp->fdesc;

        //简单连接校验
        if(tcp->fdesc == 0){
            printf("服务器地址 (%s:%d) 输入错误！\n", serverIp, serverPort);
            tcp->fdesc = 0;
            return;
        }

        if(tcp->fdesc == -1){
            printf("连接到服务器 (%s:%d) 失败！\n", serverIp, serverPort);
            tcp->fdesc = 0;
            return;
        }

        //printf("成功连接到服务器 %s:%d !\n", serverIp, serverPort);

        //返回建立的Socket句柄给JS层
        info.GetReturnValue().Set(Nan::New(tcp->fdesc));
    }

    //3. 原型方法 - 发送数据流(内部实现了简单的一次断线重连)
    void TCP::SendMessage(const Nan::FunctionCallbackInfo<Value>& info){
        TCP* tcp = ObjectWrap::Unwrap<TCP>(info.Holder());

        /*//简单参数校验
        if(tcp->fdesc == 0){
            printf("连接还未建立，请先连接到服务器！\n");
            return;
        }*/

        //发送数据给服务器
        Nan::Utf8String value(info[0]->ToString());
        int send_res = tcp->tcli->TcpSendMessage(*value);

        if(send_res <= 0){
            printf("发送信息 (%s) 失败, 返回值为 %d!\n", *value, send_res);

            //此时链路断开，进行一次的重连操作
            tcp->fdesc = tcp->tcli->TcpConnect(tcp->SERVER_ADDRESS_.c_str(), tcp->SERVER_PORT_);
            socket_connect_fd = tcp->fdesc;

            if(tcp->fdesc <= 0){
                printf("重连至服务器 (%s:%d) 失败，等待下次发送数据失败重连！\n", tcp->SERVER_ADDRESS_.c_str(), tcp->SERVER_PORT_);
                return;
            }

            //如果重连成功，则继续把丢失的数据包返回给服务器
            printf("重连至服务器 (%s:%d) 成功，补发本次丢失数据！\n", tcp->SERVER_ADDRESS_.c_str(), tcp->SERVER_PORT_);
            tcp->tcli->TcpSendMessage(*value);
        }
    }

    //4. 原型方法 - 接受数据流(uv)
    //构造结构体，存储数据流和uv_work_t对象
    struct ReqWrap{
        uv_work_t work;
        int data;
    };

    //uv_queue_work中注册的子线程函数
    void receiveData(uv_work_t *req) {
        ReqWrap * rw = (ReqWrap*) req->data;
        int socket_fd = static_cast<int> (rw->data);
        //暂时最大接受1024字节数据流
        char tmp[1024];
        while(true){
            if(socket_fd == 0){
                socket_fd = socket_connect_fd;
            }
            int n = recv(socket_fd, tmp, 1024, 0);
            if(n>0){
                tmp[n] = '\0';

                if(responseListLength > 31){
                    for(int i=0; i<32; i++){
                        responseList[i].clear();
                    }
                    responseListLength = 0;
                }
                responseList[responseListLength] = std::string(tmp);
                responseListLength++;

                //通知主线程响应数据流回调(暂时屏蔽，uv_async_send依赖于event_loop，阻塞时无法工作)
                //async.data = (void*) (&tmp);
                //uv_async_send(&async);
            }else{
                //错误输出暂时屏蔽，获取数据失败时重新设置fd的值
                //printf("错误, 返回的N为 %d 本次连接的 SOCKET_FD 为 %d\n", n, socket_fd);
                if(n <= 0){
                    socket_fd = socket_connect_fd;
                }
                continue;
            }
        }
    }

    //uv_queue_work中注册的子线程处理结束后的回调函数，正常情况下永远不会被调用！
    void final(uv_work_t *req, int status) {
        printf("数据处理完毕！\n");
        ReqWrap * rw = (ReqWrap*) req->data;
        delete rw;
        //uv_close((uv_handle_t*) &async, NULL);
    }

    //在主进程中将得到的响应返回给js层
    /*void returnDataToJS(uv_async_t *handle){
        //开启Scope，执行注册的js回调函数
        Nan::HandleScope scope;
        Local<Object> recv = Nan::New<Object>();
        const int argc = 1;
        Local<Value> argv[argc] = {Nan::New<String>(static_cast<char*> (handle->data)).ToLocalChecked()};
        Local<Function> callback_tmp = Nan::New(TCP::func_p_tcp);
        Nan::Call(callback_tmp, recv, argc, argv);
    }*/

    //真正的暴露给JS层调用的原型方法
    void TCP::ReceiveMessage(const Nan::FunctionCallbackInfo<Value>& info){
        TCP* tcp = ObjectWrap::Unwrap<TCP>(info.Holder());

        //设置JS层回调函数
        if(!info[0]->IsFunction()){
            Nan::ThrowError(Nan::New<String>("请设置回调函数！").ToLocalChecked());
            return;
        }
        if(info[0]->IsFunction()){
            Local<Function> func_l_tcp = info[0].As<Function>();
            func_p_tcp.Reset(func_l_tcp);
        }

        //构造多线程参数结构体
        ReqWrap *rw = new ReqWrap();
        rw->work.data = rw;
        rw->data = tcp->fdesc;

        //构造event_loop的主进程监听器(暂时屏蔽，uv_async依赖于event_loop，阻塞时无法正常工作)
        //uv_async_init(uv_default_loop(), &async, returnDataToJS);
        //开启收包线程
        uv_queue_work(uv_default_loop(), &rw->work, receiveData, final);
    }

    //5. 原型方法 - 获取响应列表
    void TCP::GetRecvMessageList(const Nan::FunctionCallbackInfo<Value>& info){
        Local<v8::Array> responseList_v = Nan::New<v8::Array>(responseListLength);
        for(int i=0; i < responseListLength; i++){
            responseList_v->Set(i, Nan::New<String>(responseList[i]).ToLocalChecked());
        }

        //清空前面的数组信息
        for(int i=0; i < responseListLength; i++){
            responseList[i].clear();
        }
        responseListLength = 0;

        //返回获取的数组信息给JS层
        info.GetReturnValue().Set(responseList_v);
    }

    void TCP::Close(const Nan::FunctionCallbackInfo<Value>& info){
        TCP* tcp = ObjectWrap::Unwrap<TCP>(info.Holder());
        close(tcp->fdesc);
    }
}