<style scoped lang="less">
</style>
<style>
.ivu-select-input-my-style {}
.ivu-select-input-my-style .ivu-select-input {
    text-align: center;
    padding: 0;
    font-size: 1.0em;
    height: 27px;
    font-weight: 200;
}
.ivu-select-input-my-style.ivu-select-small .ivu-select-input {
    height: 20px;
}

</style>

<template>
<div class="index">
<Row type="flex" justify="center" class="code-row-bg">
    <Col span=10 style="text-align:center">
        <!-- 组件标题 & 开始按钮-->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=15 style="text-align:center">
                <Button :disabled="disabled" type="text" shape="circle" size="small" @click="conifgHandle">
                        <h2 :id="processName">{{ processName }}</h2>
                </Button>
                <Button :disabled="disabled" type="ghost" shape="circle" size="small" @click="radioHandle" :loading="loading" 
                            style="position:absolute;top:22px;color:#657180;font-weight:200;right: -70px;">
                        Start
                </Button>
            </Col>
        </Row>
        
        <!-- 组件内容 -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=22>
                <Card>
                    <div style="text-align:center">
                        <!-- 选择所在服务器 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=18>
                                <header class="header">
                                    <span>所在服务器</span>
                                </header>
                            </Col>
                        </Row>
                        <!-- 选择器: 服务列表 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=10>
                                <Select size="small" v-model="server" filterable class="ivu-select-input-my-style" @on-change="selectHandle">
                                    <Option v-for="item in serverList" :value="item.value" :key="item.label">{{ item.label }}</Option>
                                </Select>
                            </Col>
                        </Row>

                        <!-- 选择进程 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=18>
                                <header class="header">
                                    <span>选择进程</span>
                                </header>
                            </Col>
                        </Row>
                        <!-- 进程 pid 列表 -->
                        <Radio-group v-model="e_pid" v-for="item in processList">
                            <Radio :label="item.label">
                             <Icon :type="item.type"></Icon>
                             <span>{{ item.pid }}</span>
                            </Radio>
                        </Radio-group>
                        <br>
                        
                        <!-- 选择解析类型 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=18>
                                <header class="header">
                                    <span>解析类型</span>
                                </header>
                            </Col>
                        </Row>
                        <!-- 解析操作类型列表 -->
                        <Radio-group v-model="e_opt">
                            <Radio label="own">
                                <Icon type="ios-list-outline"></Icon>
                                <span>OS</span>
                            </Radio>
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

                <!-- 以下是 Modal 对话框部分 -->
                <Modal
                    v-model="configModal"
                    :loading="configLoading"
                    @on-ok="configOk"
                    @on-cancel="configCancel"
                    :title="configTitle">
                    <dynamic-config
                        ref="dynamic"
                        :name="processName">
                    </dynamic-config>
                </Modal>
            </Col>
        </Row>
    </Col>
</Row>
<br>
</div>
</template>

<script>
    import axios from 'axios';
    import dynamicConfig from './dynamic.vue';

    export default {
        data(){
            return {
                e_pid: 'all', e_opt: 'own', loading: false, server: '',
                pidList: [], configModal: false , configLoading: true
            }
        },

        props: ['singleProjectInfo'],

        components: { dynamicConfig },

        methods: { 
            conifgHandle() { this.$_js.process.methods.conifgHandle.call(this); },
            radioHandle() { this.$_js.process.methods.radioHandle.call(this); },
            selectHandle(data) { this.$_js.process.methods.selectHandle.call(this, data); },
            configOk() { this.$_js.process.methods.configOk.call(this); },
            configCancel() { this.$_js.process.methods.configCancel.call(this); }
        },

        computed: {
            serverName() { return this.$_js.process.computed.serverName.call(this); },
            serverList() { return this.$_js.process.computed.serverList.call(this); },
            processName() { return this.$_js.process.computed.processName.call(this); },
            processList() { return this.$_js.process.computed.processList.call(this); },
            disabled() { return this.$_js.process.computed.disabled.call(this); },
            loadingTime() { return this.$_js.process.computed.loadingTime.call(this); },
            configTitle() { return this.$_js.process.computed.configTitle.call(this) }
        }
    }
</script>