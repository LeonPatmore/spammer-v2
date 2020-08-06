const metricTypes = require('../../../../metrics/metric-types');

module.exports = {
    response_code: {
        type: metricTypes.PER_REQUEST_VALUE,
    },
    response_time: {
        type: metricTypes.PER_REQUEST_VALUE,
    },
    response_code_percentile_80: {
        type: metricTypes.PERCENTILE,
        percentile: 80,
        targetMetric: 'response_time',
    },
    response_code_percentile_95: {
        type: metricTypes.PERCENTILE,
        percentile: 95,
        targetMetric: 'response_time',
    },
    response_code_percentile_99: {
        type: metricTypes.PERCENTILE,
        percentile: 99,
        targetMetric: 'response_time',
    },
};
