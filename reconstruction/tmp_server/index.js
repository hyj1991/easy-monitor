'use strict';
const easyMonitor = require('./dispatch');

//测试代码
easyMonitor({
    project_name: 'Game Boy Advanced',
    cluster: false,
    log_level: 3
});

// easyMonitor('Closure Leak');