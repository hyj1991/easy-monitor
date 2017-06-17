/**
 * Created by huangyijun on 17/2/22.
 */

//1. 长正则表达式匹配
function deadResexp(str) {
    let r = String(str).replace(/(^(\s*<br[\s\/]*>\*)+|(\s*<br[\s\/]*>\s*)+$)/igm, '');
    console.log('result is:', r);
}

let str = '<br/>                                                        早餐后自由活动，于指定时间集合自行办理退房手续。';
str += '<br/>                                      <br/>                                        <br/>                                    <br/>';
str += '                                    <br/>                                                                                                                        <br/>';
str += '                                                <br/>                                                                                                            <br/>';
str += '                                                                                                                    根据船班时间，自行前往暹粒机场，返回中国。<br/>';
str += '如需送机服务，需增加280/每单。<br/>';


//2. while死循环
function longLoop() {
    while (true) {}
}

module.exports = {
    deadResexp: deadResexp.bind(null, str),
    longLoop,
};
