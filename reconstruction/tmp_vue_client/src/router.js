const routers = [
    {
        path: '/',
        redirect: '/index'
    },
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
            title: ''
        },
        component: (resolve) => require(['./views/profiler.vue'], resolve)
    }
];
export default routers;