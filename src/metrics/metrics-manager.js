const metricTypes = require('./metric-types');

class MetricsManager {
    constructor(metricsConfig) {
        this.metrics = {};
        if (metricsConfig && metricsConfig.hasOwnProperty('metrics')) {
            for (const metric of metricsConfig.metrics) {
                const name = metric.name;
                const type = metric.type;
                this._initMetric(name, type);
            }
        }
    }

    _initMetric(name, type) {
        if (type == metricTypes.CONSTANT) this.metrics[name] = undefined;
        else if (type == metricTypes.PER_REQUEST_VALUE) this.metrics[name] = [];
        else if (type == metricTypes.ROLLING_TOTAL) this.metrics[name] = 0;
        else throw Error('Unknown metric type!');
    }

    incrementMetric(name) {
        if (!this.metrics.hasOwnProperty(name)) this._initMetric(name, metricTypes.ROLLING_TOTAL);
        this.metrics[name]++;
    }

    addMetricValue(name, value) {
        if (!this.metrics.hasOwnProperty(name)) this._initMetric(name, metricTypes.PER_REQUEST_VALUE);
        this.metrics[name].push(value);
    }
}

module.exports = MetricsManager;
