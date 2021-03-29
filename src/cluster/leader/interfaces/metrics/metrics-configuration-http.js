const metricTypes = require('../../../../metrics/metric-types');

module.exports = {
    http_response: {
        type: metricTypes.PER_REQUEST_VALUE,
        parts: {
            code: 'real',
            time: 'real',
        },
    },
    response_code_percentile_80: {
        type: metricTypes.PERCENTILE,
        percentile: 80,
        targetMetric: 'http_response',
        part: 'time',
    },
    response_code_percentile_95: {
        type: metricTypes.PERCENTILE,
        percentile: 95,
        targetMetric: 'http_response',
        part: 'time',
    },
    response_code_percentile_99: {
        type: metricTypes.PERCENTILE,
        percentile: 99,
        targetMetric: 'http_response',
        part: 'time',
    },
};
