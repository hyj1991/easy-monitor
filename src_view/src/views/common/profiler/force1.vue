<style>
path.link {
  fill: none;
  stroke: #80848f;
  stroke-width: 1.5px;
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

text {
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
  <div class="index" ref="force">
    <p>
      <strong style="font-weight:600">I. 疑似泄露链: {{ leakInfo }}</strong>
    </p>
    <div ref="detail"></div>
  </div>
</template>

<script>

export default {
  data() {
    return {}
  },

  mounted() {
  },

  props: ['heapMap', 'links', 'formatSize'],

  methods: {
    addEdges(edges, parent, leak) {
      var heapMap = this.heapMap;
      var nodeDetail = heapMap[parent];
      for (let edge of nodeDetail.edges) {
        if (leak && edge !== leak) {
          edges.push({
            s_real_id: parent,
            t_real_id: edge,
            source: `@${nodeDetail.address}`,
            target: `@${heapMap[edge].address}`,
            type: 'suit'
          });
        } else {
          edges.push({
            s_real_id: parent,
            t_real_id: edge,
            source: `@${nodeDetail.address}`,
            target: `@${heapMap[edge].address}`,
            type: 'suit'
          });
        }
      }
    }
  },

  computed: {
    leakInfo() {
      if (!this.links) return ``;
      var heapMap = this.heapMap;
      var str = this.links.map((link, index) => {
        const source = heapMap[link.source];
        if (link.target) {
          const target = heapMap[link.target];
          if (index === 0) {
            return `${source.name}::@${source.address}.${link.edge} --> ${target.name}::@${target.address}`;
          } else {
            return `.${link.edge} --> ${target.name}::@${target.address}`;
          }
        } else {
          return `${source.name}::@${source.address}`;
        }
      }).join('');

      return str;
    }
  },

  watch: {
    links() {
      if (!this.links) return;
      var heapMap = this.heapMap;
      var nodes = {};
      var edges = [];
      var links = this.links.map((link, index, array) => {
        if (link.target) {
          if (index === array.length - 1) {
            this.addEdges(edges, link.target)
          }
          this.addEdges(edges, link.source, link.target);
          return {
            s_real_id: link.source,
            t_real_id: link.target,
            source: `@${heapMap[link.source].address}`,
            target: `@${heapMap[link.target].address}`,
            s_size: index === 0 && 10 || 8,
            t_size: 8,
            type: 'leaking',
            edge: link.edge
          }
        } else {
          this.addEdges(edges, link.source);
          nodes[`@${heapMap[link.source].address}`] = {
            name: `@${heapMap[link.source].address}`,
            size: 10
          };
          return false;
        }
      }).filter(item => item).concat(edges);

      links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {
          name: link.source,
          size: link.s_size,
          real_id: link.s_real_id
        });
        link.target = nodes[link.target] || (nodes[link.target] = {
          name: link.target,
          size: link.t_size,
          real_id: link.t_real_id
        });
      });

      var w = 960;
      var h = 500;
      var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([w, h])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

      // 首先移除
      d3.select(this.$refs.force).selectAll("svg").remove();
      // 追加当前的 svg
      var svg = d3.select(this.$refs.force).append("svg:svg")
        .attr("width", w)
        .attr("height", h);
      //(1)创建箭头  
      svg.append("svg:defs").selectAll("marker")
        .data(["suit", "leaking", "cycling"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
      //(2)根据连线类型引用上面创建的标记  
      var path = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; })

      var circle = svg.append("svg:g").selectAll("circle")
        .data(force.nodes())
        .enter().append("svg:circle")
        .attr("r", 6)
        .attr("style", "")
        .on("mouseover", (function(d) {
          var nodeDetail = heapMap[d.real_id];
          var detail = `${nodeDetail.name || ''}: ${this.formatSize(nodeDetail.retainedSize)}`;
          this.$refs.detail.innerHTML = `<p><strong style="font-weight:600">II. 节点信息: ${detail}</strong></p>`;
        }).bind(this))
        .call(force.drag);
      for (let circle of svg.selectAll("circle")[0]) {
        if (circle.__data__.size) {
          circle.attributes["r"].value = circle.__data__.size;
          circle.attributes["style"].value = "fill:#21e683;stroke:#19be6b;stroke-width:1px;";
        }
      }

      var text = svg.append("svg:g").selectAll("g")
        .data(force.nodes())
        .enter().append("svg:g");

      // A copy of the text with a thick white stroke for legibility.  
      text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr("class", "shadow")
        .style("color", "red")
        .text(function(d) { return d.name; });

      text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .style("color", "red")
        .text(function(d) { return d.name; });

      // 使用椭圆弧路径段双向编码。  
      function tick() {
        //(3)打点path格式是：Msource.x,source.yArr00,1target.x,target.y  
        path.attr("d", function(d) {
          var dx = d.target.x - d.source.x,//增量  
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + ","
            + d.source.y + "A" + dr + ","
            + dr + " 0 0,1 " + d.target.x + ","
            + d.target.y;
        });

        circle.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      }
    }
  }
}
</script>