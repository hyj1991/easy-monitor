<style scoped lang="less">
    p {
        font-size: 1.0em;
        color: #3091f2;
    }
    .spin-icon-load{
        animation: ani-spin 1s linear infinite;
    }
    @keyframes ani-spin {
        from { transform: rotate(0deg);}
        50%  { transform: rotate(180deg);}
        to   { transform: rotate(360deg);}
    }
    .spin-col{
        height: 100px;
        position: relative;
        justify-content:center;
        align-items:center;
        display:-webkit-flex;
    }
</style>
<style>
    .spin-col .ivu-alert-error {
        border: 0px
    }
</style>

<template>
<div class="spin-col">
    <!-- if not error, show loading msg -->
    <Spin fix v-if="!error">
        <Icon type="load-c" size=18 class="spin-icon-load"></Icon>
        <div><p>{{ loadingMsg || defaultLoadingMsg }}</p></div>
    </Spin>

    <!-- if error, show error msg -->
    <Alert type="error" show-icon v-if="error">
        服务器内部错误
        <span slot="desc">
            详情: {{ error }}
        </span>
    </Alert>
</div>
</template>

<script>
    export default {
        data() {
            return { defaultLoadingMsg: 'Loading...' }
        },
        
        props: ['loadingMsg', 'error']
    }
</script>