<style scoped lang="less">
    .index {
        h1 {    
            font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
            font-size: 6.0em;
            font-weight: 100;
            color: #2c3e50;
        }

        h2 {
            font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
            font-size: 3.2em;
            font-weight: 100;
            color: #657180;
        }

        p {
            font-size: 1.3em;
            font-weight: 300;
            color: #657180;
        }
    }
    
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
            :singleProjectInfo="getProjectInfoList[index]">
        </process-index>

        <!-- footer -->
        <div class="footer">
          <p>© 2017 , Powered By
                  <a href="https://github.com/hyj1991/easy-monitor.git">Easy-Monitor</a>
                  , Author: <a href="https://github.com/hyj1991">hyj1991</a></p>
        </div>
    </div>
</template>
<script>
    import axios from 'axios';
    import processIndex from './common/process_index.vue';

    export default {
        created(){
            this.getIndexPageData();
        },

        data () {
            return {
                indexPageData: {}
            }
        },

        methods: {
            getIndexPageData(){
                const vm = this;
                axios.get('/axiosIndexPage')
                     .then(response=> vm.indexPageData = response.data)
                     .catch(error=> vm.answer = 'Error! Could not reach the API. ' + error);
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
                    pre.push({projectName: next, processList: projectPidMap[next]})
                    return pre;
                },[]);
            }
        }
    }
</script>