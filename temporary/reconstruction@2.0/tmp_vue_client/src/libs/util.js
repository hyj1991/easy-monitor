let util = {};
util.title = function (title) {
    title = title ? title + ' - Home' : 'Easy-Monitor';
    window.document.title = title;
};

export default util;