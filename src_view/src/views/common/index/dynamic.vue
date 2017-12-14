<style scoped lang="less">
.header span {
    margin-left:20px
}
strong {
    font-weight:400
}
</style>
<style>
.my-tag-text-style {}

.my-tag-text-style .ivu-tag-text {
    position:relative;
    top:-1px;
}
</style>


<template>
    <div class="index">
        <!-- 获取当前项目配置 loading -->
        <loading-spin :error="error" :loadingMsg="loadingMsg" v-if="!done">
        </loading-spin>

        <!-- 当前项目配置数据获取到 -->
        <div v-if="done">
            <!-- 项目名称 -->
            <p><strong>项目: {{ name }}</strong></p>

            <!-- 当前配置 -->
            <header class="header">
                <span><strong>常规动态配置项</strong></span>
            </header>
            <!-- 启动模式相关 -->
            <p style="font-size:1.1em;margin-bottom:10px">运行模式:
                <Radio-group v-model="runMode" style="margin-left:10px;vertical-align:2px">
                    <Radio label="default" :disabled="runModeDisable"></Radio>
                    <Radio label="cluster" :disabled="runModeDisable"></Radio>
                </Radio-group>
            </p>
            <!-- 日志级别调整相关 -->
            <p style="font-size:1.1em;margin-bottom:10px">日志级别:
                <Radio-group v-model="logLevel" style="margin-left:10px;vertical-align:2px">
                    <Radio label="error" :disabled="loggerDisable"></Radio>
                    <Radio label="warn" :disabled="loggerDisable"></Radio>
                    <Radio label="info" :disabled="loggerDisable"></Radio>
                    <Radio label="debug" :disabled="loggerDisable"></Radio>
                </Radio-group>
            </p>
            <!-- 数据采集分析相关 -->
            <p style="font-size:1.1em;margin-bottom:20px">开启子进程分析采集数据:
                <i-switch size="large" v-model="cpas" :disabled="cpasDisable" style="margin-left:10px;vertical-align:-7px">
                    <span slot="open">开启</span>
                    <span slot="close">关闭</span>
                </i-switch>
            </p>

            <!-- CPU Profiling 配置 -->
            <header class="header">
                <span><strong>CPU 动态配置项</strong></span>
            </header>
            <!-- 是否允许开启自定义过滤 -->
            <p style="font-size:1.1em;margin-bottom:10px">自定义过滤:
                <i-switch size="large" v-model="cpuFilter" :disabled="cpuFilterDisable" style="margin-left:10px;vertical-align:-7px">
                    <span slot="open">开启</span>
                    <span slot="close">关闭</span>
                </i-switch>
            </p>
            <!-- cpu profing 多久 -->
            <p style="font-size:1.1em;margin-bottom:10px">CPU Profiling 时间长度:
                <Input-number :max="100000" :min="1" v-model="cpuProfiler" :disabled="cpuProfilerDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 s
            </p>
            <!-- Long 时间阈值 -->
            <!-- <p style="font-size:1.1em;margin-bottom:10px">过滤执行时长阈值:
                <Input-number :max="100000" :min="1" v-model="cpuTimeout" :disabled="cpuTimeoutDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 ms
            </p> -->
            <!-- Long 展示条数限制 -->
            <!-- <p style="font-size:1.1em;margin-bottom:10px">执行超过阈值函数展示数量限制:
                <Input-number :max="500" :min="1" v-model="cpuLong" :disabled="cpuLongDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 条
            </p> -->
            <!-- Top 展示条数限制 -->
            <p style="font-size:1.1em;margin-bottom:10px">耗费最长函数展示数量限制:
                <Input-number :max="500" :min="1" v-model="cpuTop" :disabled="cpuTopDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 条
            </p>
            <!-- Bail 展示条数限制 -->
            <!-- <p style="font-size:1.1em;margin-bottom:20px">引擎逆优化最频繁展示数量限制:
                <Input-number :max="500" :min="1" v-model="cpuBailout" :disabled="cpuBailoutDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 条
            </p> -->

            <!-- Memory Profiling 配置 -->
            <header class="header">
                <span><strong>Memory 动态配置项</strong></span>
            </header>
            <!-- 解析模式 -->
            <p style="font-size:1.1em;margin-bottom:10px">Stream 解析模式:
                <i-switch size="large" v-model="memStream" :disabled="memStreamDisable" style="margin-left:10px;vertical-align:-7px">
                    <span slot="open">开启</span>
                    <span slot="close">关闭</span>
                </i-switch>
            </p>
            <!-- 是否展示 root 节点 -->
            <!-- <p style="font-size:1.1em;margin-bottom:10px">展示 Root 节点起始引力图:
                <i-switch size="large" v-model="memRoot" :disabled="memRootDisable" style="margin-left:10px;vertical-align:-7px">
                    <span slot="open">开启</span>
                    <span slot="close">关闭</span>
                </i-switch>
            </p> -->
            <!-- 展示多少个疑似泄漏点 -->
            <p style="font-size:1.1em;margin-bottom:10px">疑似泄漏点展示个数:
                <Input-number :max="50" :min="1" v-model="memLeakLimit" :disabled="memLeakLimitDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 个
            </p>
            <!-- 每一个节点子节点个数 -->
            <!-- <p style="font-size:1.1em;margin-bottom:10px">引力图每一个 Node 展示的子节点个数:
                <Input-number :max="20" :min="1" v-model="memChildren" :disabled="memChildrenDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 个
            </p> -->
            <!-- root 节点起始引力图深度 -->
            <!-- <p style="font-size:1.1em;margin-bottom:10px">Root 节点起始引力图深度:
                <Input-number :max="100" :min="1" v-model="memRootDistance" :disabled="memRootDistanceDisable || !memRoot" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 Distance
            </p> -->
            <!-- 疑似泄漏节点起始引力图深度 -->
            <!-- <p style="font-size:1.1em;margin-bottom:20px">疑似泄漏节点起始引力图深度:
                <Input-number :max="100" :min="1" v-model="memLeakDistance" :disabled="memLeakDistanceDisable" size=small style="margin-left:10px;margin-right:10px;vertical-align:-7px"></Input-number>
                 Distance
            </p> -->

            <!-- 鉴权配置 -->
            <header class="header">
                <span><strong>Auth 动态配置项</strong></span>
            </header>
            <!-- 鉴权状态 -->
            <p style="font-size:1.1em;margin-bottom:15px">鉴权模块:
                <i-switch size="large" v-model="authNeed" :disabled="authNeedDisable" style="margin-left:10px;vertical-align:-7px">
                    <span slot="open">开启</span>
                    <span slot="close">关闭</span>
                </i-switch>
            </p>
            <!-- admin 用户 -->
            <p style="font-size:1.1em;margin-bottom:15px">Admin 用户:
                <Tag class="my-tag-text-style" style="margin-left:10px;vertical-align:-7px" v-for="(item, index) in adminList" :key="item" :name="item" :closable="isAdmin && index !== 0 && authNeed" @on-close="closeAdminList">{{ item }}</Tag>
                <Poptip placement="right" v-model="adminVisiable" @on-popper-hide="adminHidden">
                    <Button :disabled="!authNeed || !isAdmin" style="margin-left:10px;vertical-align:1px" icon="ios-plus-empty" type="dashed" size="small">新增</Button>
                    <div class="api" slot="content">
                        <Input v-model="inputAdmin" placeholder="新增 Admin 用户" size="small" style="width:130px"></Input>
                        <Button type="primary" shape="circle" size="small" @click="addAdmin" style="margin-left:10px;">ok</Button>
                    </div>
                </Poptip>                    
            </p>
            <!-- normal 用户 -->
            <p style="font-size:1.1em;margin-bottom:15px">{{ name }} 项目普通用户:
                <Tag class="my-tag-text-style" style="margin-left:10px;vertical-align:-7px" v-for="item in normalList" :key="item" :name="item" :closable="authNeed" @on-close="closeNormalList">{{ item }}</Tag>
                <Poptip placement="right" v-model="normalVisiable" @on-popper-hide="normalHidden">
                    <Button :disabled="!authNeed || !adminList.length" style="margin-left:10px;vertical-align:1px" icon="ios-plus-empty" type="dashed" size="small">新增</Button>
                    <div class="api" slot="content">
                        <Input v-model="inputNormal" placeholder="新增 Normal 用户" size="small" style="width:130px"></Input>
                        <Button type="primary" shape="circle" size="small" @click="addNormal" style="margin-left:10px;">ok</Button>
                    </div>
                </Poptip>                    
            </p>
        </div>

    </div>
</template>

<script>
    import loadingSpin from '../loading.vue';

    export default {
        data() {
            return { 
                serverPid:[], done: false, error: null, user: null,
                runMode: '', runModeDisable: false,
                logLevel: '', loggerDisable: false,
                cpas: false, cpasDisable: false,
                cpuFilter: false, cpuFilterDisable: false,
                cpuProfiler: 1, cpuProfilerDisable: false,
                cpuTimeout: 1, cpuTimeoutDisable: false,
                cpuLong: 1, cpuLongDisable: false,
                cpuTop: 1, cpuTopDisable: false,
                cpuBailout: 1, cpuBailoutDisable: false,
                memStream: false, memStreamDisable: false,
                memRoot: false, memRootDisable: false,
                memLeakLimit: 1,memLeakLimitDisable: false,
                memChildren: 1, memChildrenDisable: false,
                memRootDistance: 1, memRootDistanceDisable: false,
                memLeakDistance:1, memLeakDistanceDisable: false,
                authNeed: false, authNeedDisable: false,
                adminList:[], inputAdmin: '', adminVisiable: false,
                normalList:[], inputNormal: '', normalVisiable: false
            }
        },

        created() {
            //获取配置文件
            const data = { name: this.name, type: 'get' };
            this.$_js.dynamic.methods.fetchConfig.call(this, data);
        },

        props: ["name"],

        components: { loadingSpin },

        methods: { 
            initDynamic() { return this.$_js.dynamic.methods.initDynamic.call(this); },
            axiosFetch(data, cb) { return this.$_js.dynamic.methods.axiosFetch.call(this, data, cb); },
            //admin 用户鉴权相关
            adminHidden() { return this.$_js.dynamic.methods.popperHidden.call(this, 'admin'); },
            closeAdminList(event, name) { return this.$_js.dynamic.methods.closeList.call(this, 'admin', event, name); },
            addAdmin() { return this.$_js.dynamic.methods.addList.call(this, 'admin'); },
            //normal 用户鉴权相关
            normalHidden() { return this.$_js.dynamic.methods.popperHidden.call(this, 'normal'); },
            closeNormalList(event, name) { return this.$_js.dynamic.methods.closeList.call(this, 'normal', event, name); },
            addNormal() { return this.$_js.dynamic.methods.addList.call(this, 'normal'); },
        },

        computed: {
            loadingMsg() { return this.$_js.dynamic.computed.loadingMsg.call(this); },
            isAdmin() { return this.$_js.dynamic.computed.isAdmin.call(this); }
        }
    }
</script>