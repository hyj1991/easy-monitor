'use strict';
import axios from 'axios';

/**
 * @component: views/index.vue
 * @vue-data: methods
 * @descript: 使用 axios 工具，从服务器获取到主页所需的数据
 */
function getIndexPageData() {
    const vm = this;
    axios.post(config.default.axiosPath.indexPage)
        .then(response => vm.indexPageData = response.data)
        .catch(error => vm.answer = { error: 'Error! Could not reach the API. ' + error });
}

/**
 * @component: views/index.vue
 * @vue-data: computed
 * @descript: 计算得到 project - pid 的映射对象
 */
function projectPidMap() {
    const indexPageData = this.indexPageData && this.indexPageData.data || {};
    const projectPidMap = indexPageData.projectPidMap || {};
    return projectPidMap;
}

/**
 * @component: views/index.vue
 * @vue-data: computed
 * @descript: 获取原始的 project 列表信息
 */
function sortedProjectList() {
    const originalList = Object.keys(this.projectPidMap);
    originalList.sort();
    return originalList;
}

/**
 * @component: views/index.vue
 * @vue-data: computed
 * @descript: 合并同一个 project 多台不同实例的 服务列表信息
 */
function projectInfoList() {
    const indexPageData = this.indexPageData && this.indexPageData.data || {};
    const seg = indexPageData.seg;
    const results = this.sortedProjectList.reduce((pre, next) => {
        let nextName = next;
        let nextServer = "";
        let nextList = this.projectPidMap[next].list;
        let nextLoding = this.projectPidMap[next].loading;
        if (seg) {
            nextName = next.split(seg)[0];
            nextServer = next.split(seg)[1];
        }

        if (pre[nextName]) {
            if (pre[nextName][nextServer]) {
                pre[nextName][nextServer] = pre[nextName][nextServer].concat(nextList);
            } else {
                pre[nextName].serverList.push(nextServer);
                pre[nextName][nextServer] = nextList;
            }

        } else {
            pre[nextName] = {
                projectName: nextName,
                serverList: [nextServer],
                loadingTime: nextLoding
            };
            pre[nextName][nextServer] = nextList;
        }

        return pre;
    }, {});

    return {
        list: Object.keys(results),
        map: results
    }
}

/**
 * @component: views/index.vue
 * @vue-data: computed
 * @descript: 给悬浮导航栏使用的数据，快速跳转不同项目
 */
function projectList() {
    return this.projectInfoList.list.map(item => ({
        navi: item,
        href: item
    }));
}

//导出 index.vue 所需
export default {
    methods: { getIndexPageData },
    computed: { projectPidMap, sortedProjectList, projectInfoList, projectList }
}