'use strict';
import index from './index';
import process from './process';
import profiler from './profiler';
import cpu from './cpu';
import mem from './mem';
import force from './force';

const vue = {};

function install(Vue, options) {
    const _js = {};
    _js.cpu = cpu;
    _js.mem = mem;
    _js.index = index;
    _js.process = process;
    _js.profiler = profiler;
    _js.force = force;

    Vue.prototype.$_js = _js;
}

vue.install = install;

export default vue;