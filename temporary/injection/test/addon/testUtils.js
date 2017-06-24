/**
 * Created by huangyijun on 17/2/13.
 */
const utils = require('../../build/Release/addons.node').utils;

//1.
console.log(utils.cpp_string);

//2.
utils.print('I am HYJ', 'and I am a noder!');

//3.
const returnValye = utils.returnSelf({a: 1}, 'test1', ['test2']);
console.log(returnValye);

//4.
const array = [10, 6, 3, 5, 4, 3];
const min = utils.fetchMin(array);
console.log('min num is:', min);

//5.
setInterval(() => {
    const hrTime = utils.now();
    console.log(hrTime);
}, 2000);
