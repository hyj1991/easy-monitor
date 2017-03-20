#ifndef NODE_UTILS_
#define NODE_UTILS_

#include "node.h"
#include "nan.h"

namespace nodex {
    class UTILS {
        public:
            //初始化addon的目标句柄
            static void Initialize(v8::Local<v8::Object> target);
            //声明构造函数以及析构函数
            UTILS();
            virtual ~UTILS();

        protected:
            //定义内部方法列表
            static NAN_METHOD(Print);
            static NAN_METHOD(ReturnSelf);
            static NAN_METHOD(HeapMin);
            static NAN_METHOD(Now);
  };
} //namespace nodex

#endif  // NODE_UTILS_
