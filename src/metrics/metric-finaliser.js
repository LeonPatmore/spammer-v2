const applicationLogger = require('../logger/application-logger');
const metricTypes = require('./metric-types');

async function _handleConstant(metricsStore, metricName) {
    const metricValue = await metricsStore.getConstant(metricName);
    return { [metricName]: metricValue };
}

async function _handlePercentile(metricsStore, metricName, metricConfig) {
    const targetMetric = metricConfig.targetMetric;
    const targetPart = metricConfig.part;
    const percentile = metricConfig.percentile;
    const percentileNum = await metricsStore.calculateAndPersistPercentile(
        metricName,
        targetMetric,
        targetPart,
        percentile
    );
    return { [metricName]: percentileNum };
}

async function _handlePerRequestValue(metricsStore, metricName) {
    const metrics = await metricsStore.getAllValues(metricName);
    return { [metricName]: metrics };
}

async function _handleCalculation(metricsStore, metricName, metricConfig) {
    const operation = metricConfig.operation;
    const metrics = metricConfig.metrics;
    if (operation == 'ADD') {
        const result = (await metricsStore.getConstant(metrics[0])) + (await metricsStore.getConstant(metrics[1]));
        return {
            [metricName]: result,
        };
    } else {
        applicationLogger.warn(
            `Skipping metric [ ${metricName} ] as not sure how to handle operation [ ${operation} ]`
        );
        return {};
    }
}

const HANDLERS = {};
HANDLERS[metricTypes.PERCENTILE] = _handlePercentile;
HANDLERS[metricTypes.CONSTANT] = _handleConstant;
HANDLERS[metricTypes.ROLLING_TOTAL] = _handleConstant;
HANDLERS[metricTypes.PER_REQUEST_VALUE] = _handlePerRequestValue;
HANDLERS[metricTypes.CALCULATION] = _handleCalculation;

async function finaliseMetrics(metricsStore, metricsConfig) {
    let finalMetrics = {};
    for (const metric of Object.keys(metricsConfig)) {
        const type = metricsConfig[metric].type;
        applicationLogger.info(`Finalising metric [ ${metric} ] of type [ ${type} ]`);
        const thisMetrics = await HANDLERS[type](metricsStore, metric, metricsConfig[metric]);
        finalMetrics = {
            ...finalMetrics,
            ...thisMetrics,
        };
    }
    return finalMetrics;
}

module.exports = finaliseMetrics;
