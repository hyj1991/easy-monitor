#include "utils.h"
#include "uv.h"

namespace nodex {
    using v8::Local;
    using v8::Value;
    using v8::Object;
    using v8::String;
    using v8::Array;
    using v8::Isolate;
    using v8::Number;

    //定义构造函数与析构函数
    UTILS::UTILS () {}
    UTILS::~UTILS () {}

  void UTILS::Initialize (Local<Object> target) {
    Nan::HandleScope scope;
    //Isolate* isolate = Isolate::GetCurrent();

    //定义返回给JS的Utils对象
    Local<Object> utils = Nan::New<Object>();

    //给返回对象定义方法
    Nan::SetMethod(utils, "print", UTILS::Print);
    Nan::SetMethod(utils, "returnSelf", UTILS::ReturnSelf);
    Nan::SetMethod(utils, "fetchMin", UTILS::HeapMin);
    Nan::SetMethod(utils, "now", UTILS::Now);
    //给返回的对象定义字符串键值对
    utils->Set(Nan::New<String>("cpp_string").ToLocalChecked(), Nan::New<String>("Hello, I'm Utils!").ToLocalChecked());

    //把编写的Utils挂载到V8的目标对象句柄上
    target->Set(Nan::New<String>("utils").ToLocalChecked(), utils);
  }

  //1. 定义同步打印日志方法，用于动态同步调试（区别于Node实现的console）
  NAN_METHOD(UTILS::Print) {
    //获取当前的isolate
    //Isolate* isolate = Isolate::GetCurrent();

    //检查参数长度
    int argumentLength = info.Length();
    //如果参数长度为0，则直接输出空，且返回
    if(argumentLength == 0) {
        printf("\n");
        return;
    }

    //根据入参长度组装字符串
    Local<String> str_v = info[0]->ToString();
    for(int i=1; i<argumentLength; i++){
        str_v = String::Concat(str_v, Nan::New<String>(" ").ToLocalChecked());
        str_v = String::Concat(str_v, info[i]->ToString());
    }

    //使用Nan提供的Utf8String对Local<String>进行转换并打印输出
    Nan::Utf8String str(str_v);
    printf("%s\n", static_cast<char *>(*str));
  }

  //2. 测试NAN返回值
  NAN_METHOD(UTILS::ReturnSelf){
    int argumentLength = info.Length();
    //使用Nan生成JS数组实例
    Local<Array> array = Nan::New<Array>(argumentLength);

    //将入参按照顺序放入该数组中
    for(int32_t index=0; index<argumentLength; index++){
        array->Set(index, info[index]);
    }

    //调用Nan的返回值输入方法将参数数组作为结果返回给JS
    info.GetReturnValue().Set(array);
  }

  //3. 根据堆排序计算出一个数组中的最小值
  NAN_METHOD(UTILS::HeapMin){
    int argumentLength = info.Length();
    //校验，无参数错误
    if(argumentLength == 0){
        Nan::ThrowError(Nan::New<String>("参数不能为空！").ToLocalChecked());
        return;
    }
    //校验，第一个参数不是数组错误
    if(!info[0]->IsArray()){
        Nan::ThrowError(Nan::New<String>("第一个参数必须是数组！").ToLocalChecked());
    }

    Local<Array> array = info[0].As<Array>();

    //获取数组的长度
    int arrayLength = array->Length();
    if(arrayLength == 0){
        info.GetReturnValue().Set(Nan::New<Number>(-1));
        return;
    }

    //对数组长度进行二分取整
    int index = arrayLength / 2 | 0;
    for(; index>=0; index--){
        int num1 = array->Get(index)->ToInteger()->Value();
        int num2 = array->Get(2 * index)->ToInteger()->Value();
        if(num2 != 0 && num1 > num2){
            array->Set(index, Nan::New<Number>(num2));
            array->Set(2 * index, Nan::New<Number>(num1));
        }
        num1 = array->Get(index)->ToInteger()->Value();
        num2 = array->Get(2 * index + 1)->ToInteger()->Value();

       if(num2 != 0 && num1 > num2){
            array->Set(index, Nan::New<Number>(num2));
            array->Set(2 * index + 1, Nan::New<Number>(num1));
       }
    }

    //调用Nan返回最小值给Js
    info.GetReturnValue().Set(array->Get(0));
  }

  //4. 获取当前Loop的时间戳
  NAN_METHOD(UTILS::Now){
    uint64_t now = uv_now(uv_default_loop());
    if (now <= 0xfffffff){
        info.GetReturnValue().Set(static_cast<uint32_t>(now));
    }else{
        info.GetReturnValue().Set(static_cast<double>(now));
    }
  }
}
