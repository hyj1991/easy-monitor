'use strict';

let searching = 0;

// 以下是公共方法
function find_child(parent, name, attr) {
    let children = parent.childNodes;
    for (let i = 0; i < children.length; i++) {
        if (children[i].tagName == name)
            return (attr != undefined) ? children[i].attributes[attr].value : children[i];
    }
    return;
}

function orig_load(e, attr) {
    if (e.attributes["_orig_" + attr] == undefined) return;
    e.attributes[attr].value = e.attributes["_orig_" + attr].value;
    e.removeAttribute("_orig_" + attr);
}

function orig_save(e, attr, val) {
    if (e.attributes["_orig_" + attr] != undefined) return;
    if (e.attributes[attr] == undefined) return;
    if (val == undefined) val = e.attributes[attr].value;
    e.setAttribute("_orig_" + attr, val);
}

function g_to_text(e) {
    var text = find_child(e, "title").firstChild.nodeValue;
    return (text)
}

function g_to_func(e) {
    var func = g_to_text(e);
    if (func != null)
        func = func.replace(/ .*/, "");
    return (func);
}

function zoom_child(e, x, ratio) {
    if (e.attributes != undefined) {
        if (e.attributes["x"] != undefined) {
            orig_save(e, "x");
            e.attributes["x"].value = (parseFloat(e.attributes["x"].value) - x - 10) * ratio + 10;
            if (e.tagName == "text") e.attributes["x"].value = find_child(e.parentNode, "rect", "x") + 3;
        }
        if (e.attributes["width"] != undefined) {
            orig_save(e, "width");
            e.attributes["width"].value = parseFloat(e.attributes["width"].value) * ratio;
        }
    }

    if (e.childNodes == undefined) return;
    for (let i = 0, c = e.childNodes; i < c.length; i++) {
        zoom_child(c[i], x - 10, ratio);
    }
}

function zoom_parent(e, svg) {
    if (e.attributes) {
        if (e.attributes["x"] != undefined) {
            orig_save(e, "x");
            e.attributes["x"].value = 10;
        }
        if (e.attributes["width"] != undefined) {
            orig_save(e, "width");
            e.attributes["width"].value = parseInt(svg.width.baseVal.value) - (10 * 2);
        }
    }
    if (e.childNodes == undefined) return;
    for (let i = 0, c = e.childNodes; i < c.length; i++) {
        zoom_parent(c[i], svg);
    }
}

function update_text(e) {
    let r = find_child(e, "rect");
    let t = find_child(e, "text");
    let w = parseFloat(r.attributes["width"].value) - 3;
    // let txt = find_child(e, "title").textContent.replace(/\([^(]*\)/, "");
    let txt = find_child(e, "title").textContent.split(' (')[0];
    t.attributes["x"].value = parseFloat(r.attributes["x"].value) + 3;

    // Smaller than this size won't fit anything
    if (w < 2 * 12 * 0.59) {
        t.textContent = "";
        return;
    }

    t.textContent = txt;
    // Fit in full text width
    if (/^ *$/.test(txt) || t.getSubStringLength(0, txt.length) < w)
        return;

    for (let x = txt.length - 2; x > 0; x--) {
        if (t.getSubStringLength(0, x + 2) <= w) {
            t.textContent = txt.substring(0, x) + "..";
            return;
        }
    }
    t.textContent = "";
}

function zoom_reset(e) {
    if (e.attributes != undefined) {
        orig_load(e, "x");
        orig_load(e, "width");
    }
    if (e.childNodes == undefined) return;
    for (let i = 0, c = e.childNodes; i < c.length; i++) {
        zoom_reset(c[i]);
    }
}

function search(term, matchedtxt, searchbtn) {
    let re = new RegExp(term);
    let el = document.getElementsByTagName("g");
    let matches = new Object();
    let maxwidth = 0;
    for (let i = 0; i < el.length; i++) {
        let e = el[i];
        if (e.attributes["class"].value != "func_g")
            continue;
        let func = g_to_func(e);
        let rect = find_child(e, "rect");
        if (rect == null) {
            // the rect might be wrapped in an anchor
            // if nameattr href is being used
            if (rect = find_child(e, "a")) {
                rect = find_child(r, "rect");
            }
        }
        if (func == null || rect == null)
            continue;

        // Save max width. Only works as we have a root frame
        let w = parseFloat(rect.attributes["width"].value);
        if (w > maxwidth)
            maxwidth = w;

        if (func.match(re)) {
            // highlight
            let x = parseFloat(rect.attributes["x"].value);
            orig_save(rect, "fill");
            rect.attributes["fill"].value =
                "rgb(230,0,230)";

            // remember matches
            if (matches[x] == undefined) {
                matches[x] = w;
            } else {
                if (w > matches[x]) {
                    // overwrite with parent
                    matches[x] = w;
                }
            }
            searching = 1;
        }
    }
    if (!searching) {
        matchedtxt.style["opacity"] = "1.0";
        matchedtxt.firstChild.nodeValue = "Matched: none";
        return;
    }

    searchbtn.style["opacity"] = "1.0";
    searchbtn.firstChild.nodeValue = "Reset Search"

    // calculate percent matched, excluding vertical overlap
    let count = 0;
    let lastx = -1;
    let lastw = 0;
    let keys = Array();
    for (let k in matches) {
        if (matches.hasOwnProperty(k))
            keys.push(k);
    }
    // sort the matched frames by their x location
    // ascending, then width descending
    keys.sort(function (a, b) {
        return a - b;
        if (a < b || a > b)
            return a - b;
        return matches[b] - matches[a];
    });
    // Step through frames saving only the biggest bottom-up frames
    // thanks to the sort order. This relies on the tree property
    // where children are always smaller than their parents.
    for (let k in keys) {
        let x = parseFloat(keys[k]);
        let w = matches[keys[k]];
        if (x >= lastx + lastw) {
            count += w;
            lastx = x;
            lastw = w;
        }
    }
    // display matched percent
    matchedtxt.style["opacity"] = "1.0";
    let pct = 100 * count / maxwidth;
    if (pct == 100)
        pct = "100"
    else
        pct = pct.toFixed(1)
    matchedtxt.firstChild.nodeValue = "Matched: " + pct + "%";
}

function reset_search() {
    var el = document.getElementsByTagName("rect");
    for (var i = 0; i < el.length; i++) {
        orig_load(el[i], "fill")
    }
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: methods
 * @descript: 展示函数详情
 */
function s(info) {
    this.show = 'Function: ' + info;
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: methods
 * @descript: 展示默认值
 */
function c() {
    this.show = 'Easy-Monitor';
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: methods
 * @descript: 放大点击处
 */
function zoom(event) {
    let node = event.currentTarget;
    if (this.need_unzoom[node.attributes['node-index'].value]) {
        unzoom.call(this);
    }
    let svg = document.getElementsByTagName("svg")[0];
    let attr = find_child(node, "rect").attributes;
    let width = parseFloat(attr["width"].value);
    let xmin = parseFloat(attr["x"].value);
    let xmax = parseFloat(xmin + width);
    let ymin = parseFloat(attr["y"].value);
    let ratio = (svg.width.baseVal.value - 2 * 10) / width;
    let fudge = 0.0001;

    let unzoombtn = this.$refs.unzoom;
    unzoombtn.style["opacity"] = "1.0";

    let el = document.getElementsByTagName("g");
    let upstack;
    for (let i = 0; i < el.length; i++) {
        let e = el[i];
        let a = find_child(e, "rect").attributes;
        let ex = parseFloat(a["x"].value);
        let ew = parseFloat(a["width"].value);
        if (0 == 0) {
            upstack = parseFloat(a["y"].value) > ymin;
        } else {
            upstack = parseFloat(a["y"].value) < ymin;
        }
        if (upstack) {
            if (ex <= xmin && (ex + ew + fudge) >= xmax) {
                e.style["opacity"] = "0.5";
                zoom_parent(e, svg);
                this.need_unzoom[e.attributes['node-index'].value] = true;
                update_text(e);
            }
            else
                e.style["display"] = "none";
        }
        else {
            if (ex < xmin || ex + fudge >= xmax) {
                e.style["display"] = "none";
            }
            else {
                zoom_child(e, xmin, ratio);
                this.need_unzoom[e.attributes['node-index'].value] = false;
                update_text(e);
            }
        }
    }
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: methods
 * @descript: 缩小点击
 */
function unzoom() {
    let unzoombtn = this.$refs.unzoom;
    unzoombtn.style["opacity"] = "0.0";

    let el = document.getElementsByTagName("g");
    for (let i = 0; i < el.length; i++) {
        el[i].style["display"] = "block";
        el[i].style["opacity"] = "1";
        zoom_reset(el[i]);
        update_text(el[i]);
    }
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: methods
 * @descript: 鼠标置于搜索框上
 */
function searchover(e) {
    this.$refs.search.style["opacity"] = "1.0";
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: methods
 * @descript: 鼠标移开搜索框
 */
function searchout(e) {
    let searchbtn = this.$refs.search;
    if (searching) {
        searchbtn.style["opacity"] = "1.0";
    } else {
        searchbtn.style["opacity"] = "0.1";
    }
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: search_prompt
 * @descript: 开始搜索
 */
function search_prompt() {
    let searchbtn = this.$refs.search;
    let matchedtxt = this.$refs.matched;
    if (!searching) {
        let term = prompt("请输入需要查询的函数名: (允许输入正则表达式，例如: ^ext4_)", "");
        if (term != null) {
            search(term, matchedtxt, searchbtn);
        }
    } else {
        reset_search();
        searching = 0;
        searchbtn.style["opacity"] = "0.1";
        searchbtn.firstChild.nodeValue = "Search"
        matchedtxt.style["opacity"] = "0.0";
        matchedtxt.firstChild.nodeValue = "";
    }
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: computed
 * @descript: 函数节点展示
 */
function nodes() {
    return this.data.nodes || [];
}

//导出 flamegraph.vue 所需
export default {
    methods: { s, c, zoom, unzoom, searchover, searchout, search_prompt },
    computed: { nodes }
}