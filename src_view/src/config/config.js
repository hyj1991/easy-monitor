import Env from './env';
import lodash from 'lodash';

let config = {
    env: Env,
    axiosPath: {
        indexPage: '/axiosIndexPage',
        startProfiler: '/axiosProfiler',
        getProfilerDetail: '/axiosProfilerDetail',
        getOverview: '/axiosOverview',
        checkConfig: '/axiosConfig'
    },

    vueRouter: {
        root: '/',
        index: '/index',
        profiler: '/profiler',
        overview: '/overview',
        document: '/document'
    }
};

let env_config = {};
try {
    env_config = require(`./config.${config.env}.js`).default
} catch (e) {

}

lodash.merge(config, env_config);

export default config;