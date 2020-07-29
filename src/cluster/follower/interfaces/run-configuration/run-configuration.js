const PerformanceRun = require('../../performance-run');

class RunConfiguration {
    constructor(config) {
        this.config = config;
    }
    _getRunRequest() {
        return this.config.runRequest;
    }
    _getRps() {
        return this.config.rps || 2;
    }
    _getRuntimeSeconds() {
        return this.config.runtimeSeconds || 5;
    }
    createPerformanceRun() {
        return new PerformanceRun(this._getRunRequest(), this._getRps(), this._getRuntimeSeconds());
    }
}

module.exports = RunConfiguration;
