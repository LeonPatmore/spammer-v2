const PerformanceRun = require('../../../follower/performance-run');
const metricTypes = require('../../../../metrics/metric-types');
const metricsConfigurationHttp = require('./metrics-configuration-http');
const applicationLogger = require('../../../../logger/application-logger');

const defaultMetrics = {};
defaultMetrics[PerformanceRun.successMetric] = { type: metricTypes.ROLLING_TOTAL };
defaultMetrics[PerformanceRun.failedMetric] = { type: metricTypes.ROLLING_TOTAL };
defaultMetrics[PerformanceRun.totalMetric] = {
    type: metricTypes.CALCULATION,
    operation: 'ADD',
    metrics: [PerformanceRun.successMetric, PerformanceRun.failedMetric],
};

const metricsConfigurations = {
    http: metricsConfigurationHttp,
    default: defaultMetrics,
};

function getMetricsConfiguration(config) {
    applicationLogger.info(`Getting config for interface [ ${config.interface} ]`);
    const configurationName = config.interface || 'default';
    return {
        ...metricsConfigurations.default,
        ...metricsConfigurations[configurationName],
    };
}

module.exports = getMetricsConfiguration;
