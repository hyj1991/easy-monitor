<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<style scoped lang="less">
    .func_g:hover { stroke:black; stroke-width:0.5; }
</style>

<template>
<svg version="1.1" id="flamegraph-svg"
  :data-width="data.imagewidth" :width="data.imagewidth" 
  :height="data.imageheight" :data-height="data.imageheight"
  :viewBox="data.viewbox" 
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

<defs>
	<linearGradient id="background" y1="0" y2="1" x1="0" x2="0">
    <stop :stop-color="data.bgcolor1" offset="5%" />
    <stop :stop-color="data.bgcolor2" offset="95%" />
	</linearGradient>
</defs>

<rect x="0.0" y="0" id="svg-background" :width="data.imagewidth" :height="data.imageheight" fill="url(#background)"  />
<text text-anchor="left" :x="data.xpad" :y="data.detailsY" :font-size="data.fontsize" :font-family="data.fonttype" fill="rgb(0,0,0)" id="details">{{ show }}</text>
<text text-anchor="" :x="data.xpad" y="24" :font-size="data.fontsize" :font-family="data.fonttype" fill="rgb(0,0,0)" ref="unzoom" v-on:click="unzoom()" style="opacity:0.0;cursor:pointer" >Reset Zoom</text>

<g v-for="(node, index) in nodes" :node-index="index" class="func_g" v-on:mouseover="s(`${node.name} ${node.samples}`)" v-on:mouseout="c()" v-on:click="zoom($event)" :data-search="node.search" :data-funcname="node.func">
  <title>{{ node.name }} {{node.samples}}</title>
  <rect :x="node.rect_x" :data-x="node.rect_x" :y="node.rect_y" :width="node.rect_w" :data-width="node.rect_w" :height="node.rect_h" :data-height="node.rect_h" :fill="node.rect_fill" rx="2" ry="2"></rect>
  <text :data-x="node.text_x" :x="node.text_x" :y="node.text_y" :font-size="data.fontsize" :font-family="data.fonttype" fill="rgb(0,0,0)">{{ node.text }}</text>
</g>
</svg>

</template>

<script>
    export default {
        data() {
            return {
                show: 'Easy-Monitor',
                need_unzoom: {}
            }
        },

        props: ['data'],

        methods: {
            s(info) { this.$_js.flamegraph.methods.s.call(this, info); },
            c() { this.$_js.flamegraph.methods.c.call(this); },
            zoom(event) { this.$_js.flamegraph.methods.zoom.call(this, event); },
            unzoom() { this.$_js.flamegraph.methods.unzoom.call(this); }
        },

        computed: {
            nodes(){ return this.$_js.flamegraph.computed.nodes.call(this); }
        }
    }

</script>