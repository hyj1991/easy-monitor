'use strict';

module.exports = function (heapUsed, heapMap, leakPoint, rootIndex) {
    const forceGraph = createForceGraph(heapUsed, heapMap, leakPoint);
    const searchList = [{ index: rootIndex }].concat(leakPoint)
    return { forceGraph, searchList };
}

function createForceGraph(heapUsed, heapMap, leakPoint) {
    let forceGraphAll = {};
    let leakPointLength = leakPoint.length;
    for (let i = 0; i < leakPointLength; i++) {
        let leak = leakPoint[i];
        let forceGraph = { nodes: [], links: [] };

        let biggestList = {};
        let isRecorded = {};
        let distanceDisplay = 1;
        let distanceLimit = 30;
        let childrenLimit = 5;
        let leakDistanceLimit = 8;

        let leakIndexList = [leak.index];
        let rootDistance = heapMap[leak.index].distance;
        biggestList[leak.index] = { id: heapMap[leak.index].id, source: null, retainedSize: heapMap[leak.index].retainedSize };

        while (leakIndexList.length !== 0 && distanceDisplay <= distanceLimit) {
            let tmpIndexArr = [];
            leakIndexList.forEach(index => {
                let nodeDetail = heapMap[index];
                let children = nodeDetail.children;

                //tip: child's distance === parent.distance + 1
                if (children.length > 100) children = children.slice(0, 100);
                children = children.filter(item => Boolean(Number(heapMap[item.index].distance) === (1 + Number(nodeDetail.distance))));
                children.sort((o, n) => Number(heapMap[o.index].retainedSize) < Number(heapMap[n.index].retainedSize) ? 1 : -1);
                children = children.filter((item, index) => index < childrenLimit);

                if (isRecorded[nodeDetail.id]) return;
                isRecorded[nodeDetail.id] = true;

                let isMain = Boolean(leak.index === Number(nodeDetail.index));

                let size = 30, category = 1, ignore = true, flag = true;
                if (isMain) { size = 40; category = 0; ignore = false }

                forceGraph.nodes.push({
                    index: nodeDetail.index,
                    name: nodeDetail.id,
                    attributes: { isMain },
                    id: nodeDetail.id,
                    size,
                    category,
                    ignore,
                    flag
                });

                children.forEach((child, index) => {
                    let cIndex = child.index;
                    let childDetail = heapMap[cIndex];

                    if (!isRecorded[childDetail.id]) {
                        tmpIndexArr.push(cIndex);
                    }

                    //TODO, filter reason
                    if (Math.abs(rootDistance - childDetail.distance) < leakDistanceLimit && biggestList[nodeDetail.index] && childDetail.retainedSize / biggestList[nodeDetail.index].retainedSize > (1 / childrenLimit)) {
                        biggestList[cIndex] = { id: childDetail.id, source: nodeDetail.index, sourceId: nodeDetail.id, distance: childDetail.distance, retainedSize: childDetail.retainedSize };
                    }

                    if (distanceDisplay === distanceLimit) {
                        if (isRecorded[childDetail.id]) return;
                        isRecorded[childDetail.id] = true;

                        let size = 30, category = 1, ignore = true, flag = true;
                        if (distanceDisplay === 2) { ignore = false }

                        forceGraph.nodes.push({
                            index: childDetail.index,
                            name: childDetail.id,
                            attributes: {},
                            id: childDetail.id,
                            size,
                            category,
                            ignore,
                            flag
                        });
                    }

                    forceGraph.links.push({
                        source: nodeDetail.id,
                        target: childDetail.id,
                        sourceIndex: nodeDetail.index,
                        targetIndex: childDetail.index,
                        name_or_index: child.name_or_index
                    });
                });
            });

            distanceDisplay++;
            leakIndexList = tmpIndexArr;
        }

        forceGraph.nodes.forEach(item => {
            heapUsed[item.index] = heapMap[item.index];
        });

        Object.keys(biggestList).forEach(index => {
            let data = catchNode(forceGraph.nodes, 'index', index);
            if (data) {
                setExpandOff(forceGraph, data);
            }
        });

        forceGraph.nodes.forEach(function (node) {
            node.label = node.name;
            node.symbolSize = node.size;
        });

        forceGraph.index = leak.index;

        const leakDetailTmp = heapMap[leak.index];
        forceGraphAll[`${leakDetailTmp.name}::${leakDetailTmp.id}`] = forceGraph;
    }

    return forceGraphAll;
}

function catchNode(nodes, key, value) {
    return nodes.filter(item => Number(item[key]) === Number(value))[0];
}

function setExpandOff(forceGraph, data) {
    let nodesOption = forceGraph.nodes;
    let linksOption = forceGraph.links;
    let linksNodes = [];

    if (data.flag) {
        for (let m in linksOption) {
            if (linksOption[m].source == data.id) {
                linksNodes.push(linksOption[m].target);
            }
        }
        if (linksNodes != null && linksNodes != undefined) {
            for (let p in linksNodes) {
                _findNode(nodesOption, 'id', linksNodes[p], node => {
                    node.ignore = false;
                    node.flag = true;
                });
            }
        }
        _findNode(nodesOption, 'id', data.id, node => {
            node.ignore = false;
            node.flag = false;
            node.category = 0;
        });
    } else {
        for (let m in linksOption) {
            if (linksOption[m].source == data.id) {
                linksNodes.push(linksOption[m].target);
            }
            if (linksNodes != null && linksNodes != undefined) {
                for (let n in linksNodes) {
                    if (linksOption[m].source == linksNodes[n] && linksOption[m].target != data.id) {
                        linksNodes.push(linksOption[m].target);
                    }
                }
            }
        }

        if (linksNodes != null && linksNodes != undefined) {
            for (let p in linksNodes) {
                _findNode(nodesOption, 'id', linksNodes[p], node => {
                    node.ignore = true;
                    node.flag = true;
                });
            }
        }

        _findNode(nodesOption, 'id', data.id, node => {
            node.ignore = true;
            node.flag = true;
            node.category = 1;
        });
    }
}

function _findNode(arraySource, type, value, cb) {
    arraySource.forEach(item => {
        if (item[type] === value) {
            cb(item);
        }
    })
}