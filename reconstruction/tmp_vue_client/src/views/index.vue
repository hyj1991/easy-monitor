<style scoped lang="less">
    .footer {
        padding: 50px 0;
        color: #fff;
        text-align: center;
    }
</style>

<template>
    <div class="index">
        <!-- Reserved Header Bar -->
        <Row><Col style="height:20px;"></Col></Row>
        <br>

        <!-- Easy-Monitor Title -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=10 style="text-align:center">
                <h1>Easy-Monitor</h1>
            </Col>
        </Row>
        <br>

        <!-- Project List by Axios Results -->
        <process-index 
            v-for="(item, index) in projectInfoList.list" 
            :singleProjectInfo="projectInfoList.map[item]">
        </process-index>

        <!-- Multiple project navigation -->
        <navigation :list="projectList">
        </navigation>

        <!-- Footer -->
        <div class="footer">
          <p>© 2017 , Powered By
                  <a href="https://github.com/hyj1991/easy-monitor.git" target="_Blank">Easy-Monitor</a>
                  , Author: <a href="https://github.com/hyj1991" target="_Blank">hyj1991</a></p>
        </div>
    </div>
</template>
<script>
    import axios from 'axios';
    import navigation from './common/navigation.vue';
    import processIndex from './common/index/process.vue';

    export default {
        data () {
            return {
                indexPageData: {}
            }
        },

        created(){
            this.getIndexPageData();
        },

        methods: {
            getIndexPageData(){
                const vm = this;
                axios.post('/axiosIndexPage')
                     .then(response=> vm.indexPageData = response.data)
                     .catch(error=> vm.answer = {error: 'Error! Could not reach the API. ' + error});
            }
        },

        components: {
            navigation,
            processIndex
        },

        computed: {
            projectPidMap() {
                const indexPageData = this.indexPageData && this.indexPageData.data || {};
                const projectPidMap = indexPageData.projectPidMap || {};
                return projectPidMap;
            },

            sortedProjectList() {
                const originalList = Object.keys(this.projectPidMap);
                originalList.sort();
                return originalList;
            },

            projectInfoList() {
                const indexPageData = this.indexPageData && this.indexPageData.data || {};
                const seg = indexPageData.seg;

                const results = this.sortedProjectList.reduce((pre, next)=> {
                    let nextName = next;
                    let nextServer = "";
                    let nextList = this.projectPidMap[next].list;
                    let nextLoding = this.projectPidMap[next].loading;
                    if(seg) {
                        nextName = next.split(seg)[0];
                        nextServer = next.split(seg)[1];
                    }

                    if(pre[nextName]) {
                        if(pre[nextName][nextServer]){
                            pre[nextName][nextServer] = pre[nextName][nextServer].concat(nextList);
                        }else{
                            pre[nextName].serverList.push(nextServer);
                            pre[nextName][nextServer] = nextList;
                        }

                    } else {
                        pre[nextName] = {
                            projectName: nextName,
                            serverList: [nextServer],
                            loadingTime: nextLoding
                        };
                        pre[nextName][nextServer] = nextList;
                    }

                    return pre;
                }, {});

                return {
                    list: Object.keys(results),
                    map: results
                }
            },

            projectList() {
                return this.projectInfoList.list.map(item=> ({
                    navi: item,
                    href: item
                }));
            }
        }
    }
</script>