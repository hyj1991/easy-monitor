import Env from './env';
import lodash from 'lodash';

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

lodash.merge(config, require(`./config.${Env}.js`));

export default config;