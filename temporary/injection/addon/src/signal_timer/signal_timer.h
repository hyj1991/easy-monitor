#ifndef NODE_SIGNAL_TIMER_
#define NODE_SIGNAL_TIMER_

#include "node.h"
#include "nan.h"

namespace nodex {
    class SIGNAL_TIMER {
        public:
            //初始化addon的目标句柄
            static void Initialize(v8::Local<v8::Object> target);
            //声明构造函数以及析构函数
            SIGNAL_TIMER();
            virtual ~SIGNAL_TIMER();
            //定义内部变量
            static Nan::Persistent<v8::Function> func_p;

        protected:
            //定义内部方法列表
            static NAN_METHOD(Register);
  };
} //namespace nodex

#endif  // NODE_SIGNAL_TIMER_
