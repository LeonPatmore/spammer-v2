const sleep = require('../utils/sleep');

class PerformanceRun {
    constructor(runRequest, rps, runtimeSeconds) {
        this.runRequest = runRequest;
        this.rps = rps;
        this.runtimeSeconds = runtimeSeconds;

        this.sendRequest = async () => {
            const result = await runRequest();
            return result;
        };

        this.sendBatch = async batchIndex => {
            const requests = Array(rps);
            var i;
            for (i = 0; i < rps; i++) {
                requests[i] = this.runRequest();
            }
            await Promise.all(requests);
            console.log('Finished batch ' + batchIndex);
        };

        this.run = async () => {
            let batchNumber = 0;
            var i = 0;
            for (i = 0; i < runtimeSeconds; i++) {
                batchNumber++;
                this.sendBatch(batchNumber);
                await sleep(1000);
            }
        };
    }
}

module.exports = PerformanceRun;
