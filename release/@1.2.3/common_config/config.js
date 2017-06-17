'use strict';
module.exports = {
    LOG_LEVEL: 2,
    HTTP_SERVER_PORT: 12333,
    monitorAuth: false,
    filterFunction: function (filePath, funcName) {
        //if filePath or funcName has ignore string
        let needIgnore = ['node_modules', 'anonymous'].some(fileName => {
            return Boolean(~(filePath.indexOf(fileName))) || Boolean(~(funcName.indexOf(fileName)))
        });

        //the string filePath must have
        let mustHave = ['/'].every(fileName => {
            return Boolean(~filePath.indexOf(fileName));
        });

        return !needIgnore && mustHave;
    }
};