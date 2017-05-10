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
            v-for="(item, index) in getProjectInfoList" 
            :singleProjectInfo="item">
        </process-index>

        <!-- footer -->
        <div class="footer">
          <p>© 2017 , Powered By
                  <a href="https://github.com/hyj1991/easy-monitor.git" target="_Blank">Easy-Monitor</a>
                  , Author: <a href="https://github.com/hyj1991" target="_Blank">hyj1991</a></p>
        </div>
    </div>
</template>
<script>
    import axios from 'axios';
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
            processIndex
        },

        computed: {
            getProjectInfoList(){
                const indexPageData = this.indexPageData && this.indexPageData.data || {};
                const projectPidMap = indexPageData.projectPidMap;
                if(!projectPidMap) return [];

                return Object.keys(projectPidMap).reduce((pre, next)=>{
                    pre.push({projectName: next, processList: projectPidMap[next].list, loadingTime: projectPidMap[next].loading})
                    return pre;
                },[]);
            }
        }
    }
</script>