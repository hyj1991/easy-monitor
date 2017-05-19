<style>
</style>

<template>
    <div class="index">
        <div ref="force" :style="self_style || default_style"></div>
        <div ref="detail"></div>
    </div>
</template>

<script>

export default {
    data() {
        return {
            myChart: null,
            default_style: "width:1000px;height:600px;"
        }
    },

    mounted() {
        this.renderForcegraph();
    },

    props: ['forceGraph', 'self_style', 'heapMap', 'formatSize'],

    methods: {
        renderForcegraph() {
            if(!this.forceGraph) return;    
            this.myChart = echarts2.init(this.$refs.force, 'macarons');
            this.myChart.setOption(this.forceGraphOption);
            this.myChart.on('click', this.openOrFold.bind(this));
        },

        openOrFold(param) {
            function findNode(arraySource, type, value, cb){
                arraySource.forEach(item=>{
                    if(item[type] === value){
                        cb(item);
                    }
                });
            }

            function setExpandOff(myChart, param){
                var option = myChart.getOption();
                var nodesOption = option.series[0].nodes;
                var linksOption = option.series[0].links;
                var data = param.data;
                var linksNodes = [];

                if (data != null && data != undefined && !data.source && !data.target) {
                    if (data.flag) {
                        for (var m in linksOption) {
                            if (linksOption[m].source == data.id) {
                                linksNodes.push(linksOption[m].target);
                            }
                        }
                        if (linksNodes != null && linksNodes != undefined) {
                            for (var p in linksNodes) {
                                findNode(nodesOption, 'id', linksNodes[p], node=>{
                                    node.ignore = false;
                                    node.flag = true;
                                });
                            }
                        }
                        findNode(nodesOption, 'id', data.id, node=>{
                            node.flag = false;
                            node.category = 0;
                        });

                        return option;
                    } else {
                        for (var m in linksOption) {
                            if (linksOption[m].source == data.id) {
                                linksNodes.push(linksOption[m].target);
                            }
                            if (linksNodes != null && linksNodes != undefined) {
                                for (var n in linksNodes) {
                                    if (linksOption[m].source == linksNodes[n] && linksOption[m].target != data.id) {
                                        linksNodes.push(linksOption[m].target);
                                    }
                                }
                            }
                        }

                        if (linksNodes != null && linksNodes != undefined) {
                            for (var p in linksNodes) {
                                findNode(nodesOption, 'id', linksNodes[p], node=>{
                                    node.ignore = true;
                                    node.flag = true;
                                });
                            }
                        }

                        findNode(nodesOption, 'id', data.id, node=>{
                            node.flag = true;
                            node.category = 1;
                        });

                        return option;
                    }
                }
            }

            var option = setExpandOff(this.myChart, param);

            if(option){
                this.myChart.setOption(option);
            }
        }   
    },

    computed: {
        forceGraphOption() {
            const forceGraph = this.forceGraph;
            const vm = this;
            const heapMap = vm.heapMap;
            const formatSize = vm.formatSize;
            const option = {
                tooltip: {
                    show: true,
                    formatter: function (params, ticket, callback) {//callback
                        if(!params || !params.data ) return 'error: params.data is empty!';
                        if(params.data.source || params.data.target) return params.data.source + ' -> ' + params.data.target;

                        let graphTmp = vm.myChart.getOption().series[0];
                        let id = graphTmp.nodes[params.dataIndex].id;
                        let index = graphTmp.nodes[params.dataIndex].index;

                        let linkMap = graphTmp.links.reduce((pre, next)=> {
                            let isShow = graphTmp.nodes.some(item=>item.id === next.source && Boolean(item.ignore) === false);
                            if(isShow){
                                pre[next.target] = {source: next.source, index: next.sourceIndex, name_or_index: next.name_or_index};
                            }
                            return pre;
                        }, {});

                        let result = {};
                        result.tracePath = function(id, index){
                            let str = '[' + heapMap[index].type + '] (' + heapMap[index].name + '::' + heapMap[index].id + ')';
                            let keyList = [];
                            while(id){
                                if(!linkMap[id]){
                                    break;
                                }

                                index = linkMap[id].index;

                                let strTmp = '[' + heapMap[index].type + '] (' + heapMap[index].name + '::' + heapMap[index].id + ') \' <b>' + linkMap[id].name_or_index + '</b> ---> ';
                                str = strTmp + str;
                                keyList.push(linkMap[id].name_or_index);

                                id = linkMap[id].source;
                            }

                            keyList = Array.from(new Set(keyList));
                            str = '<att>I. Reference List: </att>' + str + '<br /><br />';
                            str = str + '<att>II. Leak Key: </att>' + keyList.join(', ');
                            return str;
                        };
                        result.showStr = function (id, index){
                            let detailTmp = heapMap[index];
                            let percentage = '100.00%';
                            if(linkMap[id]){
                                percentage = ((detailTmp.retainedSize / heapMap[linkMap[id].index].retainedSize) * 100).toFixed(2) + '%';
                            }
                            return '(' + percentage + ') ' + (linkMap[id] && linkMap[id].name_or_index || 'Main') + ': [' + detailTmp.type + ', ' + detailTmp.name + ', ' + formatSize(detailTmp.retainedSize) + ', ' + detailTmp.distance + ']';
                        };
                        vm.$refs.detail.innerHTML = '<p>'+ result.tracePath(id, index) + '</p>';
                        return result.showStr(id, index);
                    }
                },
                series: [{
                    type: 'force',
                    name: "leak tree",
                    itemStyle: {
                        normal: {
                            label: {show: true},
                            nodeStyle: {
                                brushType: 'both',
                                borderColor: 'rgba(255,215,0,0.4)',
                                borderWidth: 1
                            }
                        }
                    },
                    categories: [{name: 'main'}, {name: 'else'}, {name: 'leak'}],
                    nodes: forceGraph.nodes,
                    links: forceGraph.links
                }]
            };

            return option;
        }
    },

    watch: {
        forceGraph() {
            this.renderForcegraph();
        }
    }
}
</script>