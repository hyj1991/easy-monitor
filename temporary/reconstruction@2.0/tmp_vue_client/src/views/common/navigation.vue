<style scoped lang="less">
    .index p {
        font-size: 1.0em;
    }
</style>

<template>
<div class="navigation-bar">
    <Row type="flex" justify="center" class="code-row-bg" v-if="needHome">
        <Col span=24 style="text-align:left">
            <router-link :to="config.default.vueRouter.index">
                <p>· Home</p>
            </router-link>
        </Col>
    </Row>

    <Row type="flex" justify="center" class="code-row-bg" v-for="item in navigationList">
        <Col span=24 style="text-align:left">
            <a :href="item.href">
                <p>· {{ item.navi }}</p>
            </a>
        </Col>
    </Row>
</div>
</template>

<script>
    export default {
        data() {
            return { config }
        },

        props: ['list', 'needHome'],

        computed: {
            navigationList() {
                if(!Array.isArray(this.list)) this.list = [];
                return this.list.map(item=> ({
                    navi: item.navi,
                    href: `#${item.href}`
                }));
            }
        }
    }
</script>