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

    .bg-color {
        background: #2c3e50;
    }

    .header {
        font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 300;
        margin: 10px 0 10px;
        position: relative;
    }

    .header:before {
        content: "";
        display: block;
        width: 100%;
        height: 1px;
        background: #eee;
        position: absolute;
        top: 10px;
        left: 0;
    }

    .header span {
        display: inline-block;
        background: #fff;
        padding: 0 18px 0 18px;
        position: relative;
        font-size: 14px;
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

        <!-- Project Info Row1 -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=10 style="text-align:center">
                <!-- title -->
                <Row type="flex" justify="center" class="code-row-bg">
                    <Col span=15 style="text-align:center">
                        <h2>Achilles <Button type="ghost" shape="circle" size="small" @click=handle()>Start</Button></h2>
                    </Col>
                </Row>

                <Row type="flex" justify="center" class="code-row-bg">
                    <Col span=22>
                        <Card>
                            <div style="text-align:center">
                                <header class="header">
                                    <span>选择进程</span>
                                </header>
                                <Radio-group v-model="e_pid_achilles">
                                    <Radio label="all">
                                        <Icon type="ios-browsers-outline"></Icon>
                                        <span>All</span>
                                    </Radio>
                                    <Radio label="65711">
                                        <Icon type="ios-pulse"></Icon>
                                        <span>Pid: 65711</span>
                                    </Radio>
                                    <Radio label="65712">
                                        <Icon type="ios-pulse"></Icon>
                                        <span>Pid: 65712</span>
                                    </Radio>
                                </Radio-group>
                                <br>

                                <header class="header">
                                    <span>操作</span>
                                </header>
                                <Radio-group v-model="e_opt_achilles">
                                    <Radio label="cpu">
                                        <Icon type="ios-gear-outline"></Icon>
                                        <span>CPU</span>
                                    </Radio>
                                    <Radio label="mem">
                                        <Icon type="ios-analytics-outline"></Icon>
                                        <span>MEM</span>
                                    </Radio>
                                </Radio-group>
                                <br>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
        <br>

    <!-- Project Info Row2 -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=10 style="text-align:center">
                <!-- title -->
                <Row type="flex" justify="center" class="code-row-bg">
                    <Col span=15 style="text-align:center">
                        <h2>Ares <Button type="ghost" shape="circle" size="small">Start</Button></h2>
                    </Col>
                </Row>

                <Row type="flex" justify="center" class="code-row-bg">
                    <Col span=22>
                        <Card>
                            <div style="text-align:center">
                                <header class="header">
                                    <span>选择进程</span>
                                </header>
                                <Radio-group v-model="e_pid_ares">
                                    <Radio label="all">
                                        <Icon type="ios-browsers-outline"></Icon>
                                        <span>All</span>
                                    </Radio>
                                    <Radio label="86509">
                                        <Icon type="ios-pulse"></Icon>
                                        <span>Pid: 86509</span>
                                    </Radio>
                                    <Radio label="86508">
                                        <Icon type="ios-pulse"></Icon>
                                        <span>Pid: 86508</span>
                                    </Radio>
                                    <Radio label="86507">
                                        <Icon type="ios-pulse"></Icon>
                                        <span>Pid: 86507</span>
                                    </Radio>
                                </Radio-group>
                                <br>

                                <header class="header">
                                    <span>操作</span>
                                </header>
                                <Radio-group v-model="e_opt_ares">
                                    <Radio label="cpu">
                                        <Icon type="ios-gear-outline"></Icon>
                                        <span>CPU</span>
                                    </Radio>
                                    <Radio label="mem">
                                        <Icon type="ios-analytics-outline"></Icon>
                                        <span>MEM</span>
                                    </Radio>
                                </Radio-group>
                                <br>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
        <br>

        <!-- Test Axios Results -->
        {{ getIndexPageData() }}
        This is indexPageData: {{ JSON.stringify(indexPageData) }}

        <!-- footer -->
        <div class="footer">
          <p>© 2017 , Powered By
                  <a href="https://github.com/hyj1991/easy-monitor.git">Easy-Monitor</a>
                  , Author: <a href="https://github.com/hyj1991">hyj1991</a></p>
        </div>
    </div>
</template>
<script>
    export default {
        data () {
            return {
                e_pid_achilles: 'all',
                e_opt_achilles: 'cpu',
                e_pid_ares: 'all',
                e_opt_ares: 'cpu',
                indexPageData: {}
            }
        },

        methods: {
            handle(name){
                name = name || 'achilles';
                console.log(this[`e_pid_${name}`], this[`e_opt_${name}`]);
            },

            getIndexPageData(){
                    var vm = this;
                    vm.indexPageData = {a: 1}
                    axios.get('/axiosIndexPage')
                         .then(response=> vm.indexPageData = (response.data))
                         .catch(error=> vm.answer = 'Error! Could not reach the API. ' + error);
            }
        }
    }
</script>