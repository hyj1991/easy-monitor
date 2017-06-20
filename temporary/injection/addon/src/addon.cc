#include "node.h"
#include "nan.h"
#include "utils/utils.h"
#include "signal_timer/signal_timer.h"
#include "tcp/tcp.h"
#include "signal/signal.h"

namespace nodex {
  void InitializeProfiler(v8::Local<v8::Object> target) {
    Nan::HandleScope scope;
    //1.初始化UTILS类
    UTILS::Initialize(target);
    //2.初始化SIGNAL_TIMER类
    SIGNAL_TIMER::Initialize(target);
    //3.初始化TCP
    TCP::Initialize(target);
    //4.初始化SIGNAL
    SIGNAL::Initialize(target);
  }

  NODE_MODULE(profiler, InitializeProfiler)
}
