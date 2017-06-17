#include "signal_timer.h"

namespace nodex {
    using v8::Object;
    using v8::String;
    using v8::Number;
    using v8::Local;
    using v8::Function;
    using v8::Value;
    using v8::Array;
    using v8::Isolate;

    //定义内部全局变量
    //Local<Function> callback;
    Nan::Persistent<Function> SIGNAL_TIMER::func_p;
    int interval;

    //定义构造函数与析构函数
    SIGNAL_TIMER::SIGNAL_TIMER () {}
    SIGNAL_TIMER::~SIGNAL_TIMER () {}

  void SIGNAL_TIMER::Initialize (Local<Object> target) {
    Nan::HandleScope scope;

    //定义返回给JS的Utils对象
    Local<Object> signal_timer = Nan::New<Object>();

    //给返回对象定义方法
    Nan::SetMethod(signal_timer, "register", SIGNAL_TIMER::Register);

    //给返回的对象定义字符串键值对
    signal_timer->Set(Nan::New<String>("cpp_string").ToLocalChecked(), Nan::New<String>("Hello, I'm Signal Timer!").ToLocalChecked());

    //把编写的Utils挂载到V8的目标对象句柄上
    target->Set(Nan::New<String>("signal_timer").ToLocalChecked(), signal_timer);
  }

  //定时器回调函数
  void onTimeout(int signal){
    if(signal != 0){
        alarm(interval);
    }

    Nan::HandleScope scope;
    Local<Object> recv = Nan::New<Object>();
    const int argc = 0;
    Local<Value> argv[argc] = {};
    //将全局Persistent函数引用转换回原始的Local引用
    Local<Function> callback_tmp = Nan::New(SIGNAL_TIMER::func_p);
    //调用Nan::Call静态方法执行js的回调函数
    //Nan::TryCatch tc;
    Nan::Call(callback_tmp, recv, argc, argv);
    /*if(tc.HasCaught()){
        printf("EXCEPTION:\n");
    }*/
  }

  //1. 注入Js的定时器回调函数以及间隔执行时间
  NAN_METHOD(SIGNAL_TIMER::Register){
    //进行参数校验，第一个参数必须是函数
    if(!info[0]->IsFunction()){
        Nan::ThrowError(Nan::New<String>("第一个参数必须是函数！").ToLocalChecked());
        return;
    }
    //定义定时器间隔时长，默认是5s
    interval = 5;
    if(info[1]->IsNumber()){
        interval = info[1]->ToInteger()->Value();
    }

    //将局部Local引用更改为全局Persistent引用，防止被Scope回收
    Local<Function> func_l = info[0].As<Function>();
    func_p.Reset(func_l);

    //首次调用
    onTimeout(0);

    //开启定时器
    signal(SIGALRM, onTimeout);
    alarm(interval);
  }
}
