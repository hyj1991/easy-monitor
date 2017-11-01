'use strict';

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
    for (var i = 0, c = e.childNodes; i < c.length; i++) {
        zoom_reset(c[i]);
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
 * @vue-data: computed
 * @descript: 函数节点展示
 */
function nodes() {
    return this.data.nodes || [];
}

//导出 flamegraph.vue 所需
export default {
    methods: { s, c, zoom, unzoom },
    computed: { nodes }
}