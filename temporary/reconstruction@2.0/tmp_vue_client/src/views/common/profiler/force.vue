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
        return { myChart: null, default_style: "width:1000px;height:600px;" }
    },

    mounted() {
        this.renderForcegraph();
    },

    props: ['forceGraph', 'self_style', 'heapMap', 'formatSize'],

    methods: {
        renderForcegraph() { this.$_js.force.methods.renderForcegraph.call(this); },
        openOrFold(param) { this.$_js.force.methods.openOrFold.call(this); }   
    },

    computed: {
        forceGraphOption() { return this.$_js.force.computed.forceGraphOption.call(this); }
    },

    watch: {
        forceGraph() { this.renderForcegraph(); }
    }
}
</script>