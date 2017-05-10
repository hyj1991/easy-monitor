'use strict';

module.exports = function (app, config, helper) {
    const controller = require('./controller')(app, config, helper);

    app.all('*', controller.BasicAuth);

    app.get('/', controller.IndexPidList);

    app.get('/CPUProfiler/:ProcessID', controller.CPUProfiler);

    app.get('/CPUProfiler/Project/:ProjectName', controller.CPUProfilerProject);

    app.get('/MEMProfiler/:ProcessID', controller.MEMProfiler);
};