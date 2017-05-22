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
                <h2 :id="processName">{{ processName }}
                    <Button :disabled="disabled" type="ghost" shape="circle" size="small" @click="radioHandle" :loading="loading" 
                            style="position:absolute;top:20px;margin-left:23px;color:#657180;font-weight:200;">
                        Start
                    </Button>
                </h2>
            </Col>
        </Row>
        
        <!-- 组件内容 -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=22>
                <Card>
                    <div style="text-align:center">
                        <!-- 选择所在服务器 -->
                        <header class="header">
                            <span>所在服务器</span>
                        </header>
                        
                        <!-- 选择器: 服务列表 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=8>
                                <Select size="small" v-model="server" filterable class="ivu-select-input-my-style" @on-change="selectHandle">
                                    <Option v-for="item in serverList" :value="item.value" :key="item">{{ item.label }}</Option>
                                </Select>
                            </Col>
                        </Row>

                        <!-- 选择进程 -->
                        <header class="header">
                            <span>选择进程</span>
                        </header>
                        
                        <!-- 进程 pid 列表 -->
                        <Radio-group v-model="e_pid" v-for="item in processList">
                            <Radio :label="item.label">
                             <Icon :type="item.type"></Icon>
                             <span>{{ item.pid }}</span>
                            </Radio>
                        </Radio-group>
                        <br>
                        
                        <!-- 选择解析类型 -->
                        <header class="header">
                            <span>解析类型</span>
                        </header>

                        <!-- 解析操作类型列表 -->
                        <Radio-group v-model="e_opt">
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
</div>
</template>

<script>
    import axios from 'axios';

    export default {
        data(){
            return { e_pid: 'all', e_opt: 'cpu', loading: false, server: '', pidList: [] }
        },

        props: ['singleProjectInfo'],

        methods: { 
            radioHandle() { this.$_js.process.methods.radioHandle.call(this); },
            selectHandle(data) { this.$_js.process.methods.selectHandle.call(this, data); }
        },

        computed: {
            serverName() { return this.$_js.process.computed.serverName.call(this); },
            serverList() { return this.$_js.process.computed.serverList.call(this); },
            processName() { return this.$_js.process.computed.processName.call(this); },
            processList() { return this.$_js.process.computed.processList.call(this); },
            disabled() { return this.$_js.process.computed.disabled.call(this); },
            loadingTime() { return this.$_js.process.computed.loadingTime.call(this); }
        }
    }
</script>