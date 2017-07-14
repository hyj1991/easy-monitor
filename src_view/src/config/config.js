import Env from './env';
import lodash from 'lodash';

//获取配置
const options = window.options || {};
const httpPrefix = options.http_prefix || '';

let config = {
    env: Env,
    axiosPath: {
        indexPage: `${httpPrefix}/axiosIndexPage`,
        startProfiler: `${httpPrefix}/axiosProfiler`,
        getProfilerDetail: `${httpPrefix}/axiosProfilerDetail`,
        getOverview: `${httpPrefix}/axiosOverview`,
        checkConfig: `${httpPrefix}/axiosConfig`,
        fetchConfig: `${httpPrefix}/axiosFetchConfig`,
    },

    vueRouter: {
        root: `${httpPrefix}/`,
        index: `${httpPrefix}/index`,
        profiler: `${httpPrefix}/profiler`,
        overview: `${httpPrefix}/overview`,
        document: `${httpPrefix}/document`
    }
};

let env_config = {};
try {
    env_config = require(`./config.${config.env}.js`).default
} catch (e) {

}

lodash.merge(config, env_config);

export default config;