#ifndef NODE_SIGNAL_
#define NODE_SIGNAL_

#include "node.h"
#include "nan.h"

namespace nodex {
    class SIGNAL {
        public:
            //初始化addon的目标句柄
            static void Initialize(v8::Local<v8::Object> target);
            //声明构造函数以及析构函数
            SIGNAL();
            virtual ~SIGNAL();
            //定义内部变量
            static Nan::Persistent<v8::Function> func_p1;
            static Nan::Persistent<v8::Function> func_p2;

        protected:
            //定义内部方法列表
            static NAN_METHOD(OnSignalUSR1);
            static NAN_METHOD(OnSignalUSR2);
  };
} //namespace nodex

#endif  // NODE_SIGNAL_TIMER_
