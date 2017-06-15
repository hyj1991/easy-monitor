import Env from './env';

let config = {
    env: Env,
    axiosPath: {
        indexPage: '/easy-monitor/demo/axiosIndexPage',
        startProfiler: '/easy-monitor/demo/axiosProfiler',
        getProfilerDetail: '/easy-monitor/demo/axiosProfilerDetail',
        getOverview: '/easy-monitor/demo/axiosOverview'
    },

    vueRouter: {
        root: '/easy-monitor/demo',
        index: '/easy-monitor/demo/index',
        profiler: '/easy-monitor/demo/profiler',
        overview: '/easy-monitor/demo/overview'
    }
};
export default config;
