<style>
.force-tooltip {
  width: 120;
  height: auto;
  padding: 0px 5px;
  position: absolute;
  text-align: center;
  border-style: solid;
  border-width: 1px;
  background-color: rgba(73, 80, 96, 0.87);
  border-radius: 3px;
}

path.link {
  fill: none;
  stroke: #80848f;
  stroke-width: 1px;
}

marker#suit {
  fill: #5cadff;
}

path.link.suit {
  stroke: #5cadff;
}

marker#leaking {
  fill: #19be6b;
}

path.link.leaking {
  stroke: #19be6b;
}

path.link.cycling {
  stroke-dasharray: 0, 2 1;
}

circle {
  fill: #5cadff;
  stroke: #2d8cf0;
  stroke-width: 1px;
}

.force-view text {
  font: 10px sans-serif;
  pointer-events: none;
}

text.shadow {
  stroke: #fff;
  stroke-width: 3px;
  stroke-opacity: .8;
}
</style>

<template>
  <div class="force-view" ref="force">
  </div>
</template>

<script>

export default {
  data() {
    return { nodeOrdinal: null }
  },

  mounted() {
    document.addEventListener('click', (e) => {
      const $dom = document.querySelector('.force-tooltip');
      if ($dom) {
        $dom.style.opacity = '0.0'
      }
    })
  },

  props: ['heapMap', 'links', 'formatSize'],

  methods: {
    addEdges(edges, parent, leak) { this.$_js.force.methods.addEdges.apply(this, [edges, parent, leak]); }
  },

  computed: {
    leakInfo() { return this.$_js.force.computed.leakInfo.call(this); }
  },

  watch: {
    links() { this.$_js.force.watch.links.call(this); }
  }
}
</script>
