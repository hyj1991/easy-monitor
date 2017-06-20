'use strict';
const uuidV4 = require('uuid/v4');
const basicAuth = require('basic-auth');
const analysisLib = require('v8-analytics');

module.exports = function (app, config, helper) {
    const logger = helper.logger;

    return {
        BasicAuth(req, res, next){
            if (!config.monitorAuth || typeof config.monitorAuth !== 'function') {
                return next();
            }

            let credentials = basicAuth(req);

            if (!credentials) {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Easy Monitor"');
                return next('Access denied');
            }

            config.monitorAuth(credentials.name, credentials.pass).then(isAuthed => {
                if (isAuthed) {
                    return next();
                }
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Easy Monitor"');
                next('Access denied');
            }).catch(next);
        },

        IndexPidList(req, res, next){
            let cachedMap = helper.getCachedSocket();
            let pidList = Object.keys(cachedMap);
            let {projectList, projectPidMap} = pidList.reduce((pre, next) => {
                let newProjectName = next.split('::')[0];
                let newProjectPid = next.split('::')[1];
                if (!~pre.projectList.indexOf(newProjectName)) {
                    pre.projectList.push(newProjectName);
                }
                if (pre.projectPidMap[newProjectName]) {
                    pre.projectPidMap[newProjectName].push(newProjectPid);
                } else {
                    pre.projectPidMap[newProjectName] = [newProjectPid];
                }
                return pre;
            }, {projectList: [], projectPidMap: {}});
            
            //helper.writeFile(__dirname, './index.json', JSON.stringify({projectList, projectPidMap}));
            res.render('NewIndex', {projectList, projectPidMap});
        },

        CPUProfiler(req, res, next){
            const uuid = uuidV4();
            let processId = req.params.ProcessID;
            let socket = helper.getCachedSocket()[processId];
            if (socket) {
                socket.write(JSON.stringify({
                        type: config.MESSAGE_TYPE[2],
                        data: JSON.stringify({
                            timeout: req.query.timeout || 500,
                            long_limit: req.query.long_limit,
                            top_limit: req.query.top_limit,
                            bail_limit: req.query.bail_limit,
                            uuid
                        })
                    }) + '\n\n');

                helper.event.once(uuid, statistics => {
                    res.render('CPUProfiler', {
                        processName: processId.split('::')[0],
                        processPid: processId.split('::')[1],
                        timeout: req.query.timeout || 500,
                        data: statistics
                    });
                });
            } else {
                res.redirect('/');
            }
        },

        CPUProfilerProject(req, res, next){
            function getProcessProfilerP(item) {
                let socket = item.socket;
                let name = item.name;
                return new Promise((resolve, reject) => {
                    const uuid = uuidV4();
                    socket.write(JSON.stringify({
                            type: config.MESSAGE_TYPE[2],
                            data: JSON.stringify({
                                timeout: req.query.timeout || 500,
                                long_limit: req.query.long_limit,
                                top_limit: req.query.top_limit,
                                bail_limit: req.query.bail_limit,
                                uuid
                            })
                        }) + '\n\n');

                    helper.event.once(uuid, statistics => {
                        resolve({
                            processName: name.split('::')[0],
                            processPid: name.split('::')[1],
                            timeout: req.query.timeout || 500,
                            data: statistics
                        })
                    });
                });
            }


            let projectName = req.params.ProjectName;
            let socketPackage = helper.getCachedSocket();
            let socketList = Object.keys(socketPackage).reduce((pre, next) => {
                if (next.split('::')[0] === projectName) {
                    pre.push({name: next, socket: socketPackage[next]});
                }
                return pre;
            }, []);

            if (socketList.length === 0) {
                res.redirect('/');
            } else {
                let promiseList = socketList.map(item => getProcessProfilerP(item));
                Promise.all(promiseList).then(result => {
                    //helper.writeFile(__dirname, './cpu.json', JSON.stringify({projectName, data: result}));
                    res.render('CPUProfilerProject', {
                        projectName,
                        data: result
                    })
                });
            }
        },

        MEMProfiler(req, res, next){
            const uuid = uuidV4();
            let processId = req.params.ProcessID;
            let socket = helper.getCachedSocket()[processId];
            if (socket) {
                //console.time('cost');
                socket.write(JSON.stringify({
                        type: config.MESSAGE_TYPE[4],
                        data: JSON.stringify({
                            uuid
                        })
                    }) + '\n\n');

                helper.event.once(uuid, heapData => {
                    logger.info(`monitorserver->start analysis heapsnapshot...`);
                    //helper.writeFile(__dirname, './mem.json', JSON.stringify({heapData}));
                    let {heapMap, leakPoint, statistics, rootIndex, aggregates} = analysisLib.memAnalytics(heapData, req.query.leak_limit);
                    logger.info(`monitorserver->analysis heapsnapshot end...`);
                    /*const fs = require('fs');
                     fs.writeFileSync('./heapSnapshot.json', JSON.stringify({
                     heapMap,
                     leakPoint,
                     statistics,
                     aggregates,
                     }));*/
                    /*console.log('done');
                     console.log(rootIndex);
                     console.log(leakPoint);
                     console.log(statistics);
                     console.log(aggregates);*/

                    //console.timeEnd('cost');
                    /*helper.writeFile(__dirname, './mem.json', JSON.stringify({
                        leak_limit: req.query.leak_limit || 5,
                        processName: processId.split('::')[0],
                        processPid: processId.split('::')[1],
                        heapMap,
                        leakPoint,
                        statistics,
                        aggregates,
                    }));*/
                    
                    res.render('NewMEMProfiler', {
                        leak_limit: req.query.leak_limit || 5,
                        processName: processId.split('::')[0],
                        processPid: processId.split('::')[1],
                        heapMap,
                        leakPoint,
                        statistics,
                        aggregates,
                        helper
                    });
                });
            } else {
                res.redirect('/');
            }

            /*const heapSnapshot = require('/Users/huangyijun/git/examples/heapSnapshot.json');
             res.render('NewMEMProfiler', {
             leak_limit: req.query.leak_limit || 5,
             processName: processId.split('::')[0],
             processPid: processId.split('::')[1],
             heapMap: heapSnapshot.heapMap,
             leakPoint: heapSnapshot.leakPoint,
             statistics: heapSnapshot.statistics,
             aggregates: heapSnapshot.aggregates,
             helper
             });*/
        }
    }
};