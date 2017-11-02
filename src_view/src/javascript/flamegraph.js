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

// flamegraph 颜色
const colorMap = (function () {
    function scalarReverse(s) {
        return s.split('').reverse().join('')
    }

    function nameHash(name) {
        let vector = 0
        let weight = 1
        let max = 1
        let mod = 10
        let ord

        name = name.replace(/.(.*?)`/, '')
        let splits = name.split('')
        for (let i = 0; i < splits.length; i++) {
            ord = splits[i].charCodeAt(0) % mod
            vector += (ord / (mod++ - 1)) * weight
            max += weight
            weight *= 0.70
            if (mod > 12) break
        }

        return (1 - vector / max)
    }

    function color(type, hash, name) {
        let v1, v2, v3, r, g, b
        if (!type) return 'rgb(0, 0, 0)'

        if (hash) {
            v1 = nameHash(name)
            v2 = v3 = nameHash(scalarReverse(name))
        } else {
            v1 = Math.random() + 1
            v2 = Math.random() + 1
            v3 = Math.random() + 1
        }

        switch (type) {
            case 'hot':
                r = 205 + Math.round(50 * v3);
                g = 0 + Math.round(230 * v1);
                b = 0 + Math.round(55 * v2);
                return `rgb(${r}, ${g}, ${b})`;
            case 'mem':
                r = 0
                g = 190 + Math.round(50 * v2)
                b = 0 + Math.round(210 * v1)
                return `rgb(${r}, ${g}, ${b})`
            case 'io':
                r = 80 + Math.round(60 * v1)
                g = r
                b = 190 + Math.round(55 * v2)
                return `rgb(${r}, ${g}, ${b})`
            default:
                throw new Error('Unknown type ' + type)
        }
    }

    function colorMap(paletteMap, colorTheme, hash, func) {
        if (paletteMap[func]) return paletteMap[func]
        paletteMap[func] = color(colorTheme, hash, func)
        return paletteMap[func]
    }

    return colorMap;
})();

// 获取渲染的 context 信息
const contextify = (function () {

    function oneDecimal(x) {
        return (Math.round(x * 10) / 10)
    }

    function htmlEscape(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

    function contextify(parsed, opts) {
        let each = parsed.each;
        let time = parsed.time
        let timeMax = opts.timemax
        let ypadTop = opts.fontsize * 4           // pad top, include title
        let ypadBottom = opts.fontsize * 2 + 10      // pad bottom, include labels
        let xpad = 10
        let xpad2 = opts.imagewidth * 0.85
        let depthMax = 0
        let frameHeight = opts.frameheight
        let paletteMap = {}

        if (timeMax < time && timeMax / time > 0.02) {
            console.error('Specified timemax %d is less than actual total %d, so it will be ignored', timeMax, time)
            timeMax = Infinity
        }

        timeMax = Math.min(time, timeMax)

        let widthPerTime = (opts.imagewidth - 2 * xpad) / timeMax
        let minWidthTime = opts.minwidth / widthPerTime

        function markNarrowBlocks(nodes) {
            function mark(k) {
                let val = parsed.nodes[k]
                if (typeof val.stime !== 'number') throw new Error('Missing start for ' + k)
                if ((val.etime - val.stime) < minWidthTime) {
                    val.narrow = true
                    return
                }

                val.narrow = false
                depthMax = Math.max(val.depth, depthMax)
            }

            Object.keys(nodes).forEach(mark)
        }

        // NodeProcessor proto
        function processNode(node) {
            let func = node.func
            let depth = node.depth
            let etime = node.etime
            let stime = node.stime
            let factor = opts.factor
            let countName = opts.countname
            let isRoot = !func.length && depth === 0

            if (isRoot) etime = timeMax

            let samples = Math.round((etime - stime * factor) * 10) / 10
            let costTime = samples * each
            let samplesTxt = samples.toLocaleString()
            let pct
            let pctTxt
            let escapedFunc
            let name
            let sampleInfo

            if (isRoot) {
                name = 'all'
                sampleInfo = `(${samplesTxt} ${countName} ${utils.formatTime(costTime)}, 100%)`
            } else {
                pct = Math.round((100 * samples) / (timeMax * factor) * 10) / 10
                pctTxt = pct.toLocaleString()
                escapedFunc = htmlEscape(func)

                name = escapedFunc
                sampleInfo = `(${samplesTxt} ${countName} ${utils.formatTime(costTime)}), ${pctTxt}%)`
            }

            let x1 = oneDecimal(xpad + stime * widthPerTime)
            let x2 = oneDecimal(xpad + etime * widthPerTime)
            let y1 = oneDecimal(imageHeight - ypadBottom - (depth + 1) * frameHeight + 1)
            let y2 = oneDecimal(imageHeight - ypadBottom - depth * frameHeight)

            let chars = (x2 - x1) / (opts.fontsize * opts.fontwidth)
            let showText = false
            let text

            if (chars >= 3) { // enough room to display function name?
                showText = true
                text = func.slice(0, chars)
                if (chars < func.length) text = text.slice(0, chars - 2) + '..'
                text = htmlEscape(text)
            }

            return {
                name: name
                , search: name.toLowerCase()
                , samples: sampleInfo
                , rect_x: x1
                , rect_y: y1
                , rect_w: x2 - x1
                , rect_h: y2 - y1
                , rect_fill: colorMap(paletteMap, opts.colors, opts.hash, func)
                , text: text
                , text_x: x1 + (showText ? 3 : 0)
                , text_y: 3 + (y1 + y2) / 2
                , narrow: node.narrow
                , func: htmlEscape(func)
            }
        }

        function processNodes(nodes) {
            let keys = Object.keys(nodes)
            let acc = new Array(keys.length)

            for (let i = 0; i < keys.length; i++) {
                acc[i] = processNode(nodes[keys[i]], each)
            }

            return acc
        }

        markNarrowBlocks(parsed.nodes)

        let imageHeight = (depthMax * frameHeight) + ypadTop + ypadBottom
        let ctx = Object.assign(opts, {
            imageheight: imageHeight
            , xpad: xpad
            , xpad2: xpad2
            , titleX: opts.imagewidth / 2
            , detailsY: imageHeight - (frameHeight / 2)
            , viewbox: `0 0 ${opts.imagewidth} ${imageHeight}`
        })

        ctx.nodes = processNodes(parsed.nodes)
        return ctx
    }

    return contextify;
})();

const utils = (function () {

    function formatTime(ts) {
        ts = !isNaN(ts) && ts || 0;
        let str = '';
        if (ts < 1e3) {
            str = `${ts.toFixed(2)} ms`;
        } else if (ts < 1e3 * 60) {
            str = `${(ts / 1e3).toFixed(2)} s`;
        } else if (ts < 1e3 * 60 * 60) {
            str = `${(ts / (1e3 * 60)).toFixed(2)} min`;
        } else if (ts < 1e3 * 60 * 60 * 60) {
            str = `${(ts / (1e3 * 60 * 60)).toFixed(2)} h`;
        } else {
            str = `${ts.toFixed(2)} ms`;
        }

        return str;
    }
    return { formatTime };
})();

function narrowify(context, opts) {
    function processNode(n) {
        n.class = n.narrow ? 'hidden' : ''
    }

    function filterNode(n) {
        return !n.narrow
    }

    if (opts.removenarrows) context.nodes = context.nodes.filter(filterNode)
    else context.nodes.forEach(processNode)
}

/**
 * @component: views/common/profiler/flamegraph.vue
 * @vue-data: mounted
 * @descript: 计算 svg 渲染数据
 */
function mounted() {
    // 计算 svg 真实宽度
    const imagewidth = this.$refs.svg.clientWidth;
    this.flamegraphData.fconfig.imagewidth = imagewidth;
    // 传输过程中 timemax 会丢失
    this.flamegraphData.fconfig.timemax = Infinity;
    // 计算 svg 其余渲染数据
    const context = contextify(this.flamegraphData.parsed, this.flamegraphData.fconfig);
    narrowify(context, this.flamegraphData.fconfig);

    this.data = context;
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
    mounted,
    methods: { s, c, zoom, unzoom, searchover, searchout, search_prompt },
    computed: { nodes }
}