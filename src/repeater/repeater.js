const sleep = require('../utils/sleep');

class Repeater {
    constructor(runRequest, rps, runtimeSeconds) {
        this.runRequest = runRequest;
        this.rps = rps;
        this.runtimeSeconds = runtimeSeconds;
    }

    async start(onFinish) {
        const batches = Array(this.runtimeSeconds);
        let batchNumber = 0;
        var i = 0;
        console.info(`Starting repitition [ ${this.runtimeSeconds} ] seconds at [ ${this.rps} ] rps.`);
        for (i = 0; i < this.runtimeSeconds; i++) {
            batchNumber++;
            batches[i] = this._sendBatch(batchNumber);
            await sleep(1000);
        }
        await Promise.all(batches).then(_ => onFinish());
    }

    async _sendBatch(batchIndex) {
        const requests = Array(this.rps);
        let i;
        for (i = 0; i < this.rps; i++) {
            requests[i] = this._sendRequest();
        }
        await Promise.all(requests);
        console.debug('Finished batch ' + batchIndex);
    }

    async _sendRequest() {
        await this.runRequest();
    }
}

module.exports = Repeater;
