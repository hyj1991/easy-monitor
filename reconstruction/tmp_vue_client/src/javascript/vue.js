'use strict';
import index from './index';
import process from './process';
import profiler from './profiler';
import cpu from './cpu';
import mem from './mem';
import force from './force';
import echart3 from './echart3';

const vue = {};

function install(Vue, options) {
    Vue.prototype.$_js = { cpu, mem, index, process, profiler, force, echart3 };
}

vue.install = install;

export default vue;