import Env from './env';

let config = {
    env: Env,
    axiosPath: {
        indexPage: '/easy-monitor/demo/axiosIndexPage',
        startProfiler: '/easy-monitor/demo/axiosProfiler',
        getProfilerDetail: '/easy-monitor/demo/axiosProfilerDetail',
        getOverview: '/easy-monitor/demo/axiosOverview',
        checkConfig: '/easy-monitor/demo/axiosConfig',
        fetchConfig: '/easy-monitor/demo/axiosFetchConfig',
    },

    vueRouter: {
        root: '/easy-monitor/demo',
        index: '/easy-monitor/demo/index',
        profiler: '/easy-monitor/demo/profiler',
        overview: '/easy-monitor/demo/overview',
        document: '/easy-monitor/demo/document'
    }
};
export default config;
