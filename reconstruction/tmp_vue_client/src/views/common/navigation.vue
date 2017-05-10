<style scoped lang="less">
    .index p {
        font-size: 1.0em;
    }
</style>

<template>
<div class="navigation-bar">
    <Row type="flex" justify="center" class="code-row-bg">
        <Col span=22 style="text-align:left">
            <router-link to="/index">
                <p>· Home</p>
            </router-link>
        </Col>
    </Row>

    <Row type="flex" justify="center" class="code-row-bg" v-for="item in navigationList">
        <Col span=22 style="text-align:left">
            <a :href="item.href">
                <p>· Pid-{{ item.pid }} </p>
            </a>
        </Col>
    </Row>    
</div>
</template>

<script>
    export default {
        props: ['allProfiler'],

        computed: {
            navigationList() {
                if(!Array.isArray(this.allProfiler)) this.allProfiler = [];
                return this.allProfiler.map(item=> ({
                    pid: item.processPid,
                    href: `#pid_${item.processPid}`
                }));
            }
        }
    }
</script>