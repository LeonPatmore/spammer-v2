const sleep = require('../utils/sleep');

class PerformanceRun {
    constructor(runRequest, rps, runtimeSeconds) {
        this.runRequest = runRequest;
        this.rps = rps;
        this.runtimeSeconds = runtimeSeconds;
    }

    async run(onFinish) {
        const batches = Array(this.runtimeSeconds);
        let batchNumber = 0;
        var i = 0;
        for (i = 0; i < this.runtimeSeconds; i++) {
            batchNumber++;
            batches[i] = this.sendBatch(batchNumber);
            await sleep(1000);
        }
        await Promise.all(batches).then(_ => onFinish('hello'));
    }

    async sendBatch(batchIndex) {
        const requests = Array(this.rps);
        var i;
        for (i = 0; i < this.rps; i++) {
            requests[i] = this.runRequest();
        }
        await Promise.all(requests);
        console.log('Finished batch ' + batchIndex);
    }

    async sendRequest() {
        const result = await runRequest();
        return result;
    }
}

module.exports = PerformanceRun;