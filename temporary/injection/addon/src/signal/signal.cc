#include "signal.h"

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
    Nan::Persistent<Function> SIGNAL::func_p1;
    Nan::Persistent<Function> SIGNAL::func_p2;


    //定义构造函数与析构函数
    SIGNAL::SIGNAL () {}
    SIGNAL::~SIGNAL () {}

  void SIGNAL::Initialize (Local<Object> target) {
    Nan::HandleScope scope;

    //定义返回给JS的Utils对象
    Local<Object> signal = Nan::New<Object>();

    //给返回对象定义方法
    Nan::SetMethod(signal, "onSignalUSR1", SIGNAL::OnSignalUSR1);
    Nan::SetMethod(signal, "onSignalUSR2", SIGNAL::OnSignalUSR2);

    //把编写的Utils挂载到V8的目标对象句柄上
    target->Set(Nan::New<String>("signal").ToLocalChecked(), signal);
  }

  void OnUSR1(int signal){
        Nan::HandleScope scope;
        Local<Object> recv = Nan::New<Object>();
        const int argc = 0;
        Local<Value> argv[argc] = {};
        //将全局Persistent函数引用转换回原始的Local引用
        Local<Function> callback_tmp = Nan::New(SIGNAL::func_p1);
        //调用Nan::Call静态方法执行js的回调函数
        Nan::Call(callback_tmp, recv, argc, argv);
  }

  void OnUSR2(int signal){
          Nan::HandleScope scope;
          Local<Object> recv = Nan::New<Object>();
          const int argc = 0;
          Local<Value> argv[argc] = {};
          //将全局Persistent函数引用转换回原始的Local引用
          Local<Function> callback_tmp = Nan::New(SIGNAL::func_p2);
          //调用Nan::Call静态方法执行js的回调函数
          Nan::Call(callback_tmp, recv, argc, argv);
  }

  NAN_METHOD(SIGNAL::OnSignalUSR1){
    Local<Function> func_tmp = info[0].As<Function>();
    func_p1.Reset(func_tmp);

    signal(SIGUSR1, OnUSR1);
  }

  NAN_METHOD(SIGNAL::OnSignalUSR2){
    Local<Function> func_tmp = info[0].As<Function>();
    func_p2.Reset(func_tmp);

    signal(SIGUSR2, OnUSR2);
  }
}
