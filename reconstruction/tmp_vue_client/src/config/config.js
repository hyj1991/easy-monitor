import Env from './env';

let config = {
    env: Env,
    axiosPath: {
        indexPage: '/axiosIndexPage',
        startProfiler: '/axiosProfiler',
        getProfilerDetail: '/axiosProfilerDetail'
    },

    vueRouter: {
        index: '/index',
        profiler: '/profiler'
    }
};
export default config;