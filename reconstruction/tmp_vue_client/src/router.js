const routers = [
    {
        path: '/index',
        meta: {
            title: ''
        },
        component: (resolve) => require(['./views/index.vue'], resolve)
    },
    {
        path: '/profiler',
        meta: {
            title: 'abc'
        },
        component: (resolve) => require(['./views/index.vue'], resolve)
    }
];
export default routers;