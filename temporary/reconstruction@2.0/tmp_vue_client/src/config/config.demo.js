import Env from './env';

let config = {
    env: Env,
    axiosPath: {
        indexPage: '/easy-monitor/demo/axiosIndexPage',
        startProfiler: '/easy-monitor/demo/axiosProfiler',
        getProfilerDetail: '/easy-monitor/demo/axiosProfilerDetail'
    },

    vueRouter: {
        root: '/easy-monitor/demo',
	    index: '/easy-monitor/demo/index',
        profiler: '/easy-monitor/demo/profiler'
    }
};
export default config;
