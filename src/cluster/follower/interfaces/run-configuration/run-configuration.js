const PerformanceRun = require('../../performance-run');

class RunConfiguration {
    constructor(config, metricsConfig) {
        this.config = config;
        this.metricsConfig = metricsConfig;
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
        return new PerformanceRun(this._getRunRequest(), this._getRps(), this._getRuntimeSeconds(), this.metricsConfig);
    }
}

module.exports = RunConfiguration;
