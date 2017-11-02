'use strict';
import index from './index';
import process from './process';
import profiler from './profiler';
import cpu from './cpu';
import mem from './mem';
import force from './force';
import echart3 from './echart3';
import loading from './loading';
import overview from './overview';
import dashboard from './dashboard';
import dynamic from './dynamic';
import flamegraph from './flamegraph';

const vue = {};

function install(Vue, options) {
    Vue.prototype.$_js = { cpu, mem, index, process, profiler, force, echart3, loading, overview, dashboard, dynamic, flamegraph };
}

vue.install = install;

export default vue;