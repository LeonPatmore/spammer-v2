const PerformanceRun = require('../../../follower/performance-run');
const metricTypes = require('../../../../metrics/metric-types');
const metricsConfigurationHttp = require('./metrics-configuration-http');

const defaultMetrics = {};
defaultMetrics[PerformanceRun.successMetric] = { type: metricTypes.ROLLING_TOTAL };
defaultMetrics[PerformanceRun.failedMetric] = { type: metricTypes.ROLLING_TOTAL };
defaultMetrics[PerformanceRun.totalMetric] = { type: metricTypes.ROLLING_TOTAL };

const metricsConfigurations = {
    http: metricsConfigurationHttp,
    default: defaultMetrics,
};

function getMetricsConfiguration(config) {
    console.log('getting config for ' + config.interface);
    const configurationName = config.interface || 'default';
    return {
        ...metricsConfigurations.default,
        ...metricsConfigurations[configurationName],
    };
}

module.exports = getMetricsConfiguration;
