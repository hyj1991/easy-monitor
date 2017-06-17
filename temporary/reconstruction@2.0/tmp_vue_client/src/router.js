const routers = [
    {
        path: config.default.vueRouter.root,
        redirect: config.default.vueRouter.index
    },
    {
        path: config.default.vueRouter.index,
        meta: {
            title: ''
        },
        component: (resolve) => require(['./views/index.vue'], resolve)
    },
    {
        path: config.default.vueRouter.profiler,
        meta: {
            title: ''
        },
        component: (resolve) => require(['./views/profiler.vue'], resolve)
    }
];
export default routers;
