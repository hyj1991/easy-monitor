'use strict';

//建立全局缓存
const cache = {
    maps: {},
    sourceNodes: [],
    sourceLinks: []
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: inner function
 * @descript: 针对 root 节点做特殊的处理
 */
function isRoot(vm) {
    return Boolean(vm.forceGraph && vm.forceGraph.index === 0)
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: inner function
 * @descript: 过滤出只需要展示的节点
 */
function filterNodesLinks(option, tmpIdList) {
    tmpIdList = tmpIdList || [];
    const maps = cache.maps;
    const nodesOption = cache.sourceNodes;
    const linksOption = cache.sourceLinks;
    //先选取引力关系
    const needLinks = linksOption.filter(link => !maps[link.source].ignore || !maps[link.target].ignore);

    const tmp = {};
    const needNodes = [];

    //对于手动传入的变更节点，一定加入
    tmpIdList.forEach(id => {
        if (!tmp[id]) {
            tmp[id] = true;
            needNodes.push(maps[id]);
        }
    });
    //根据引力关系计算展示节点
    needLinks.forEach(link => {
        const nodeSource = maps[link.source];
        const nodeTarget = maps[link.target];

        if (!tmp[nodeSource.id]) {
            tmp[nodeSource.id] = true;
            needNodes.push(nodeSource);
        }

        if (!tmp[nodeTarget.id]) {
            tmp[nodeTarget.id] = true;
            needNodes.push(nodeTarget);
        }
    });

    //仅给引力图传递了需要展示的数据
    option.series[0].nodes = needNodes;
    option.series[0].links = needLinks;
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: methods
 * @descript: 渲染出 echarts2 的引力图
 */
function renderForcegraph() {
    if (!this.forceGraph) return;
    this.myChart = echarts2.init(this.$refs.force, 'macarons');
    this.myChart.setOption(this.forceGraphOption);
    this.myChart.on('click', this.openOrFold.bind(this));
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: methods
 * @descript: js实现点击引力图节点 开启 / 关闭 功能
 */
function openOrFold(param) {

    function findNode(arraySource, type, value, cb) {
        arraySource.forEach(item => {
            if (item[type] === value) {
                cb(item);
            }
        });
    }

    function setExpandOff(myChart, param) {
        var option = myChart.getOption();
        //空间换时间
        var mapsOption = cache.maps;
        var nodesOption = cache.sourceNodes;
        var linksOption = cache.sourceLinks;
        var data = param.data;
        var linksNodes = [];
        //定义父节点
        const father = mapsOption[data.id];

        if (data != null && data != undefined && !data.source && !data.target) {
            if (data.flag) {
                //找出子节点的过程
                linksNodes = father.children;
                //将子节点设置为开启，只设置一层
                if (linksNodes != null && linksNodes != undefined) {
                    //子节点设置开启
                    linksNodes.forEach(link => {
                        const node = mapsOption[link];
                        node.ignore = false;
                        node.flag = true;
                    });
                }
                //更改父节点状态
                father.flag = false;
                father.category = 0;

                //只展示需要的
                filterNodesLinks(option);
                return option;
            } else {
                const tmp = [];
                //找出子节点
                father.children.forEach(c => linksNodes.push(c));
                let array = [];
                linksNodes.forEach(l => array.push(l));
                let need = true;
                while (array.length !== 0 && need) {
                    const tmp = [];
                    let tmpNeed = false;
                    array.forEach(l => {
                        const node = mapsOption[l];
                        //如果本轮子节点均需要忽略，则跳出循环，只要本轮子节点有一个不需要忽略，继续下一轮
                        if (!node.ignore) tmpNeed = true;
                        //设置需要关闭的子节点
                        node.children.forEach(c => tmp.push(c));
                    });
                    need = tmpNeed;
                    array = tmp;
                    tmp.forEach(l => linksNodes.push(l));
                }

                //将所有子节点设置为关闭
                if (linksNodes != null && linksNodes != undefined) {
                    linksNodes.forEach(link => {
                        const node = mapsOption[link];
                        node.ignore = true;
                        node.flag = true;

                        tmp.push(node.id);
                    });
                }

                //更改父节点状态
                father.flag = true;
                father.category = 1

                //只展示需要的
                filterNodesLinks(option, tmp);
                return option;
            }
        }
    }

    var option = setExpandOff(this.myChart, param);

    if (option) {
        this.myChart.setOption(option);
    }
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: computed
 * @descript: 引力图配置信息计算
 */
function forceGraphOption() {
    const forceGraph = this.forceGraph;
    const vm = this;
    const heapMap = vm.heapMap;
    const formatSize = vm.formatSize;
    const option = {
        tooltip: {
            show: true,
            showDelay: 100,
            position: function (position) {
                return [position[0], position[1] - 20];
            },
            formatter: function (params, ticket, callback) {//callback
                if (!params || !params.data) return 'error: params.data is empty!';
                if (params.data.source || params.data.target) return params.data.source + ' -> ' + params.data.target;

                let graphTmp = vm.myChart.getOption().series[0];
                let id = graphTmp.nodes[params.dataIndex].id;
                let index = graphTmp.nodes[params.dataIndex].index;

                let linkMap = graphTmp.links.reduce((pre, next) => {
                    let isShow = graphTmp.nodes.some(item => item.id === next.source && Boolean(item.ignore) === false);
                    if (isShow) {
                        pre[next.target] = { source: next.source, index: next.sourceIndex, name_or_index: next.name_or_index };
                    }
                    return pre;
                }, {}) || {};

                let result = {};
                result.tracePath = function (id, index) {
                    let str = '[' + heapMap[index].type + '] (' + heapMap[index].name + '::' + heapMap[index].id + ')';
                    let keyList = [];
                    while (id) {
                        if (!linkMap[id]) {
                            break;
                        }

                        index = linkMap[id].index;

                        let strTmp = '[' + heapMap[index].type + '] (' + heapMap[index].name + '::' + heapMap[index].id + ') \' <strong style="font-weight:600">' + linkMap[id].name_or_index + '</strong> ---> ';
                        str = strTmp + str;
                        keyList.push(linkMap[id].name_or_index);

                        id = linkMap[id].source;
                    }

                    keyList = Array.from(new Set(keyList));
                    str = '<strong style="font-weight:600">I. Reference List: </strong>' + str + '<br /><br />';
                    str = str + '<strong style="font-weight:600">II. Leak Key: </strong>' + keyList.join(', ');
                    return str;
                };
                result.showStr = function (id, index) {
                    let detailTmp = heapMap[index];
                    let percentage = '100.00%';
                    if (linkMap[id]) {
                        percentage = ((detailTmp.retainedSize / heapMap[linkMap[id].index].retainedSize) * 100).toFixed(2) + '%';
                    }

                    let str = '';
                    str = '(' + percentage + ') ' + (linkMap[id] && linkMap[id].name_or_index || 'Main') + ': [' + detailTmp.type + ', ' + detailTmp.name + ', ' + formatSize(detailTmp.retainedSize) + ', ' + detailTmp.distance + ']';

                    return str;
                };
                //root 节点放弃治疗
                if (!isRoot(vm)) {
                    vm.$refs.detail.innerHTML = '<p>' + result.tracePath(id, index) + '</p>';
                }
                return result.showStr(id, index);
            }
        },
        series: [{
            type: 'force',
            name: "leak tree",
            itemStyle: {
                normal: {
                    label: { show: true },
                    nodeStyle: {
                        brushType: 'both',
                        borderColor: 'rgba(255,215,0,0.4)',
                        borderWidth: 1
                    }
                }
            },
            categories: [{ name: 'main' }, { name: 'else' }, { name: 'leak' }],
            nodes: [],
            links: []
        }]
    };

    //保存源数据
    forceGraph.nodes.forEach(n => cache.maps[n.id] = n);
    cache.sourceNodes = forceGraph.nodes;
    cache.sourceLinks = forceGraph.links;

    //只展示需要的
    filterNodesLinks(option);
    return option;
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: computed
 * @descript: 计算当前节点大小
 */
function retainedSize() {
    const heapMap = this.heapMap || {};
    const index = this.forceGraph && this.forceGraph.index || 0;

    const retainedSize = heapMap[index] && heapMap[index].retainedSize || 0;

    return this.formatSize(retainedSize);
}

//导出 force.vue 所需
export default {
    methods: { renderForcegraph, openOrFold },
    computed: { forceGraphOption, retainedSize }
}