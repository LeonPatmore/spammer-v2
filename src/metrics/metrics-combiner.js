const PerformanceRun = require('../cluster/follower/performance-run');
const metricTypes = require('./metric-types');

const defaultMetricsConfig = {};

defaultMetricsConfig[PerformanceRun.successMetric] = metricTypes.ROLLING_TOTAL;
defaultMetricsConfig[PerformanceRun.failedMetric] = metricTypes.ROLLING_TOTAL;
defaultMetricsConfig[PerformanceRun.totalMetric] = metricTypes.ROLLING_TOTAL;

function _handleMetricList(name, list, metricsConfig) {
    if (metricsConfig[name] == metricTypes.ROLLING_TOTAL) {
        return list.reduce((a, b) => a + b, 0);
    } else {
        return list;
    }
}

function metricsCombiner(metricsConfig, metrics) {
    const metricsConfigFull = {
        ...metricsConfig,
        ...defaultMetricsConfig,
    };
    const metricLists = {};
    for (const metricDict of metrics) {
        for (const metric in metricDict) {
            if (!metricLists.hasOwnProperty(metric)) metricLists[metric] = [metricDict[metric]];
            else metricLists[metric].push(metricDict[metric]);
        }
    }
    const finalMetrics = {};
    for (const metricListName in metricLists) {
        finalMetrics[metricListName] = _handleMetricList(
            metricListName,
            metricLists[metricListName],
            metricsConfigFull
        );
    }
    return finalMetrics;
}

module.exports = metricsCombiner;
