<style scoped lang="less">
</style>

<template>
<div>
    <Row type="flex" justify="center" class="code-row-bg">
        <!-- memory module title -->
        <Col span=16 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ listInfo.process.pid }}</h2>
        </Col>
        <br>

        <!-- memory module body -->
        <Col span=16>
            <Card>
                <!-- memory profiling not end, show loding spin -->
                <loading-spin v-if="server_error || !listInfo.done" 
                              :loadingMsg="listInfo.loadingMsg"
                              :error="server_error">
                </loading-spin>

                <div v-if="!server_error && listInfo.done">
                    Memory Profiler Results
                </div>
            </Card>
        </Col>
    </Row>
</div>
</template>

<script>
    import loadingSpin from '../loading.vue';

    export default {
        
        props: ['singleProfiler', 'error'],

        components: {
            loadingSpin
        },

        computed: {
            singleProfilerData() {
                const data = this.singleProfiler && this.singleProfiler.data || {};

                return {};
            },

            listInfo() {
                const singleProfiler = this.singleProfiler || {};
                const singleProfilerData = this.singleProfilerData || {};

                const done = singleProfiler.done;
                const loadingMsg = singleProfiler.loadingMsg;
                
                const process = {
                    pid: singleProfiler.processPid,
                    href: `pid_${singleProfiler.processPid}`,
                    machineUnique: singleProfiler.machineUnique
                }

                return {done, loadingMsg, process};
            },

            server_error() {
                console.log(12333, this.singleProfiler);
                return this.error || (this.singleProfiler && this.singleProfiler.error) || false;
            },
        }
    }
</script>