const routers = [
    {
        path: '/index',
        meta: {
            title: ''
        },
        component: (resolve) => require(['./views/index.vue'], resolve)
    }
];
export default routers;