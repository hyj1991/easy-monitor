<style scoped lang="less">
</style>

<template>
    <div class="index" ref="statistics" :style="self_style || default_style"></div>
</template>

<script>

export default {
    data() {
        return { default_style: "width:600px;height:400px;" }
    },

    mounted() {
        this.renderCharts();
    },

    props: ['self_style' , 'data', 'message'],

    methods: {
        renderCharts() { this.$_js.echart3.methods.renderCharts.call(this); }
    },

    computed: {
        chartOption() { return this.$_js.echart3.computed.chartOption.call(this); }
    },

    watch: {
        //if data changed, re-render eachrt3
        data() { this.renderCharts(); }
    }
}
</script>