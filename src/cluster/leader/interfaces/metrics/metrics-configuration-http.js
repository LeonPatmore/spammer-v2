const metricTypes = require('../../../../metrics/metric-types');

module.exports = {
    response_code: {
        type: metricTypes.PER_REQUEST_VALUE,
    },
    response_time: {
        type: metricTypes.PER_REQUEST_VALUE,
    },
    response_code_perentile: {
        type: metricTypes.PERCENTILE,
        percentile: 80,
        targetMetric: 'response_time',
    },
};
