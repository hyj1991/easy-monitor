'use strict';

/**
 * @component: views/common/loading.vue
 * @vue-data: watch
 * @descript: 根据 axios 获取到的 loadingMsg 数据进行分段解析
 */
function loadingMsg() {
    const vm = this;
    let loadingMsg = vm.loadingMsg;
    if (!Array.isArray(loadingMsg)) loadingMsg = [loadingMsg];
    for (let i = 0, l = loadingMsg.length; i < l; i++) {
        if (i === 0) vm.loadingMsgSingle = loadingMsg[i];
        else setTimeout(() => vm.loadingMsgSingle = loadingMsg[i], i * 900 / l);
    }
}

//导出 loading.vue 所需
export default {
    watch: { loadingMsg }
}