const metricTypes = require('./metric-types');
const logger = require('../logger/logger');

/**
 *
 * @param {*} name
 * @param {*} list
 * @param {*} metricsConfig
 */
function _handleMetricList(name, list, metricsConfig) {
    if (!metricsConfig.hasOwnProperty(name)) return [].concat.apply([], list);
    if (metricsConfig[name].type == metricTypes.ROLLING_TOTAL) {
        return list.reduce((a, b) => a + b, 0);
    } else {
        return [].concat.apply([], list);
    }
}

/**
 *
 * @param {*} metricsConfig
 * @param {*} currentMetrics
 */
function _createNewMetrics(metricsConfig, currentMetrics) {
    for (metricName in metricsConfig) {
        const metricType = metricsConfig[metricName].type;
        switch (metricType) {
            case metricTypes.PERCENTILE:
                const targetMetric = metricsConfig[metricName].targetMetric;
                const percentileNumber = metricsConfig[metricName].percentile;

                const sortedValues = currentMetrics[targetMetric].sort((a, b) => a - b);
                const index = Math.ceil((sortedValues.length * percentileNumber) / 100.0);

                currentMetrics[metricName] = sortedValues[index];
                break;
        }
    }
}

/**
 *
 * @param {object}  metricsConfig
 * @param {Array}   metrics
 */
function metricsCombiner(metricsConfig, metrics) {
    logger.info(`Combining metrics with config ${JSON.stringify(metricsConfig)}`);
    const metricLists = {};
    for (const metricDict of metrics) {
        for (const metric in metricDict) {
            if (!metricLists.hasOwnProperty(metric)) metricLists[metric] = [metricDict[metric]];
            else metricLists[metric].push(metricDict[metric]);
        }
    }
    const finalMetrics = {};
    for (const metricListName in metricLists) {
        finalMetrics[metricListName] = _handleMetricList(metricListName, metricLists[metricListName], metricsConfig);
    }
    _createNewMetrics(metricsConfig, finalMetrics);
    return finalMetrics;
}

module.exports = metricsCombiner;
