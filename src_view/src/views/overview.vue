<style scoped lang="less">
</style>

<template>
    <div class="index">
         <!-- 预留 Header Bar -->
        <Row><Col style="height:20px;"></Col></Row>
        <br>

        <!-- 项目名称 -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=16 style="text-align:center"><h1>{{ processName }}</h1></Col>
            <br>
        </Row>
        <br>

        <!-- 渲染 overview 概览组件 -->
        <dashboard
            v-for="(item, index) in pidList"
            :pid="item"
            :rawParams="params">
        </dashboard>

         <!-- 悬浮导航栏 -->
        <navigation :list="overViewComputed" needHome=true>
        </navigation>
    </div>
</template>

<script>
import navigation from './common/navigation.vue';
import dashboard from './common/overview/dashboard.vue';

export default {
    data() {
        return { params: null }
    },

    created() {
        const params = this.$route.query; 
        if(!Array.isArray(params.pidList)) params.pidList = [params.pidList];
        this.params = params;
    },

    components: { dashboard, navigation },

    computed: {
        processName(){ return this.$_js.overview.computed.processName.call(this); },
        pidList() { return this.$_js.overview.computed.pidList.call(this); },
        overViewComputed() { return this.$_js.overview.computed.overViewComputed.call(this); }
    }
}    
</script>