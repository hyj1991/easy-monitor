'use strict';

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: method
 * @descript: 添加边
 */
function addEdges(edges, parent, leak) {
    let heapMap = this.heapMap;
    let nodeDetail = heapMap[parent];
    for (let edge of nodeDetail.edges) {
        if (leak && edge.realId !== leak) {
            edges.push({
                s_real_id: parent,
                t_real_id: edge.realId,
                source: `@${nodeDetail.address}`,
                target: `@${heapMap[edge.realId].address}`,
                type: 'suit',
                edge: edge.edge
            });
        } else if (!leak) {
            edges.push({
                s_real_id: parent,
                t_real_id: edge.realId,
                source: `@${nodeDetail.address}`,
                target: `@${heapMap[edge.realId].address}`,
                type: 'suit',
                edge: edge.edge
            });
        }
    }
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: computed
 * @descript: 获取泄漏展示信息
 */
function leakInfo() {
    if (!this.links) return ``;
    let heapMap = this.heapMap;
    let leakKeyList = [];
    let str = this.links.map((link, index) => {
        const source = heapMap[link.source];
        if (link.target) {
            const target = heapMap[link.target];
            if (index === 0) {
                leakKeyList.push(`<strong style="font-weight:600">II. 泄漏关键字: </strong>${link.edge}`);
                return `<strong style="font-weight:600">I. 泄漏链: </strong>${source.name}::@${source.address}<strong style="font-weight:600">.${link.edge}</strong> --> ${target.name}::@${target.address}`;
            } else {
                leakKeyList.push(`${link.edge}`);
                return `<strong style="font-weight:600">.${link.edge}</strong> --> ${target.name}::@${target.address}`;
            }
        } else {
            leakKeyList.push(`<strong style="font-weight:600">II. 泄漏关键字: </strong>无`)
            return `<strong style="font-weight:600">I. 泄漏链: </strong>${source.name}::@${source.address}`;
        }
    }).join('');

    let firstKey = leakKeyList.shift();
    leakKeyList = Array.from(new Set(leakKeyList));
    leakKeyList.unshift(firstKey);

    return {
        leakList: str,
        leakKeyList: leakKeyList.join(', ')
    };
}

/**
 * @component: views/common/profiler/force.vue
 * @vue-data: watch
 * @descript: 生成引力图 svg
 */
function links() {
    if (!this.links) return;
    let heapMap = this.heapMap;
    let nodes = {};
    let edges = [];
    let links = this.links.map((link, index, array) => {
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
                main: index === 0,
                t_size: 8,
                type: 'leaking',
                edge: link.edge
            }
        } else {
            this.addEdges(edges, link.source);
            nodes[`@${heapMap[link.source].address}`] = {
                name: `@${heapMap[link.source].address}`,
                size: 10,
                main: true,
                real_id: link.source
            };
            return false;
        }
    }).filter(item => item).concat(edges);

    links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = {
            name: link.source,
            size: link.s_size,
            real_id: link.s_real_id,
            main: link.main
        });
        link.target = nodes[link.target] || (nodes[link.target] = {
            name: link.target,
            size: link.t_size,
            real_id: link.t_real_id
        });
    });

    let w = 960;
    let h = 500;
    let force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([w, h])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    // 首先移除
    d3.select(this.$refs.force).selectAll("*").remove();
    // 追加当前的 svg
    let svg = d3.select(this.$refs.force).append("svg:svg")
        .attr("width", w)
        .attr("height", h);
    let leakInfo = d3.select(this.$refs.force).append("p")
        .html(this.leakInfo.leakList);
    let br = d3.select(this.$refs.force).append("br");
    let leakKeyList = d3.select(this.$refs.force).append("p")
        .html(this.leakInfo.leakKeyList);
    // 添加 tooltip
    let show = false;
    let tooltip = d3.select(this.$refs.force)
        .append("div")
        .attr("class", "force-tooltip")
        .style("opacity", 0.0)
        .on("click", function (d) {
            show = true;
            d3.event.stopPropagation();
        });
    //(1)创建箭头  
    svg.append("svg:defs").selectAll("marker")
        .data(["suit", "leaking", "cycling"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
    //(2)根据连线类型引用上面创建的标记  
    let path = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
        .attr("class", function (d) { return "link " + d.type; })
        .attr("marker-end", function (d) { return "url(#" + d.type + ")"; })
        .on("mouseover", (function (d) {
            show = false;
            let source = heapMap[d.source.real_id];
            let target = heapMap[d.target.real_id];
            let sourceName = source.name;
            if (sourceName.length > 50) {
                sourceName = sourceName.substr(0, 50);
            }
            let targetName = target.name;
            if (targetName.length > 50) {
                targetName = targetName.substr(0, 50);
            }
            tooltip.html(`<p style="font-size:1px;color:white">${sourceName} .${d.edge} --> ${targetName}</p>`)
                .style("left", (d3.event.offsetX + 40) + "px")
                .style("top", (d3.event.offsetY + 50) + "px")
                .style("opacity", 1.0);
        }).bind(this))
        .on("mousemove", (function (d) {
            // tooltip.style("left", (d3.event.pageX) + "px")
            //   .style("top", (d3.event.pageY - 120) + "px");
        }).bind(this))
        .on("mouseout", (function (d) {
            if (!show) {
                tooltip.style("opacity", 0.0);
            }
        }).bind(this))
        .on("click", (function (d) {
            show = true;
            d3.event.stopPropagation();
        }).bind(this))
        .call(force.drag);

    let circle = svg.append("svg:g").selectAll("circle")
        .data(force.nodes())
        .enter().append("svg:circle")
        .attr("r", 6)
        .attr("style", "")
        .on("mouseover", (function (d) {
            show = false;
            let nodeOrdinal = heapMap[d.real_id];
            let name = nodeOrdinal.name;
            if (name.length > 50) {
                // 名字过长做截取
                name = name.substr(0, 50);
            }
            tooltip.html(`<p style="font-size:1px;color:white">${name}: ${this.formatSize(nodeOrdinal.retainedSize)}</p>`)
                .style("left", (d3.event.offsetX + 40) + "px")
                .style("top", (d3.event.offsetY + 50) + "px")
                .style("opacity", 1.0);
        }).bind(this))
        .on("mousemove", (function (d) {
            // tooltip.style("left", (d3.event.pageX) + "px")
            //   .style("top", (d3.event.pageY - 120) + "px");
        }).bind(this))
        .on("mouseout", (function (d) {
            if (!show) {
                tooltip.style("opacity", 0.0);
            }
        }).bind(this))
        .on("click", (function (d) {
            show = true;
            d3.event.stopPropagation();
        }).bind(this))
        .call(force.drag);
    for (let circle of svg.selectAll("circle")[0]) {
        // #ffbc58
        if (circle.__data__.size && circle.__data__.main) {
            circle.attributes["r"].value = circle.__data__.size;
            circle.attributes["style"].value = "fill:#ffbc58;stroke:#ff9900;stroke-width:1px;";
            continue;
        }
        if (circle.__data__.size && !circle.__data__.main) {
            circle.attributes["r"].value = circle.__data__.size;
            circle.attributes["style"].value = "fill:#21e683;stroke:#19be6b;stroke-width:1px;";
        }
    }

    let text = svg.append("svg:g").selectAll("g")
        .data(force.nodes())
        .enter().append("svg:g");

    // A copy of the text with a thick white stroke for legibility.  
    text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr("class", "shadow")
        .style("color", "red")
        .text(function (d) { return d.name; });

    text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .style("color", "red")
        .text(function (d) { return d.name; });

    // 使用椭圆弧路径段双向编码。  
    function tick() {
        //(3)打点path格式是：Msource.x,source.yArr00,1target.x,target.y  
        path.attr("d", function (d) {
            let dx = d.target.x - d.source.x,//增量  
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + ","
                + d.source.y + "A" + dr + ","
                + dr + " 0 0,1 " + d.target.x + ","
                + d.target.y;
        });

        circle.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }
}

//导出 force.vue 所需
export default {
    methods: { addEdges }, computed: { leakInfo }, watch: { links }
}