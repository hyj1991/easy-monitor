'use strict';
const assert = require('assert');
const easyMonitor = require('../');
const commonConfig = require('../common_config/config');

describe('filterFunction', () => {
    before(() => {
        easyMonitor({appName: 'My Project', logLevel: 0});
    });

    it('(/opt/server/node/MyProject/node_modules/express/index.js) must be ignore', () => {
        assert(commonConfig.filterFunction('(/opt/server/node/MyProject/node_modules/express/index.js)', 'application') === false);
    });

    it('anonymous must be ignore', () => {
        assert(commonConfig.filterFunction('(/opt/server/node/MyProject/index.js)', 'anonymous') === false);
    });

    it('(idle) must be ignore', () => {
        assert(commonConfig.filterFunction('(idle)', 'applications') === false);
    });
});