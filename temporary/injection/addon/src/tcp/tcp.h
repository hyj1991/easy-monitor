#ifndef NODE_TCP_
#define NODE_TCP_

#include "node.h"
#include "nan.h"
#include "tcp_client.h"

namespace nodex{
    class TCP : public Nan::ObjectWrap {
        public:
            //初始化addon的目标句柄
            static void Initialize(v8::Local<v8::Object> target);
            //声明构造函数以及析构函数
            TCP(char* sa_, int sp_);
            virtual ~TCP();

            //定义内部变量
            static Nan::Persistent<v8::Function> func_p_tcp;

        protected:
            //以下给构造JS Class使用
            static Nan::Persistent<v8::Function> constructor;
            static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);
            static void Connect(const Nan::FunctionCallbackInfo<v8::Value>& info);
            static void SendMessage(const Nan::FunctionCallbackInfo<v8::Value>& info);
            static void ReceiveMessage(const Nan::FunctionCallbackInfo<v8::Value>& info);
            static void GetRecvMessageList(const Nan::FunctionCallbackInfo<v8::Value>& info);
            static void Close(const Nan::FunctionCallbackInfo<v8::Value>& info);

            //定义内部变量
            std::string SERVER_ADDRESS_;
            int SERVER_PORT_;
            TcpClient* tcli;
            int fdesc = 0;
    };
}

#endif //NODE_TCP_