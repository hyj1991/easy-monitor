'use strict';
const path = require('path');

exports = module.exports = {
    require: {
        //项目根路径设置
        src_root: path.join(__dirname, '../')
    },
}

//bef 数组为空，表示此配置项顺序任意
//一般仅在函数配置项中采用
//exports.order = { bef: [] }
