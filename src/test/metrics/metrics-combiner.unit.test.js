const metricsCombiner = require('../../metrics/metrics-combiner');
const metricTypes = require('../../metrics/metric-types');

const someMetricConfig = {
    metric_one: {
        type: metricTypes.ROLLING_TOTAL,
    },
    metric_two: {
        type: metricTypes.ROLLING_TOTAL,
    },
};

it('Test single result with default configs', () => {
    const result = metricsCombiner(someMetricConfig, [
        {
            metric_one: 20,
            metric_two: 15,
        },
    ]);

    expect(result).toHaveProperty('metric_one');
    expect(result.metric_one).toEqual(20);
    expect(result).toHaveProperty('metric_two');
    expect(result.metric_two).toEqual(15);
});

it('Test single result with default configs THEN defaults to list', () => {
    const result = metricsCombiner({}, [
        {
            unknown_metric: 20,
        },
        {
            unknown_metric: 12,
        },
        {
            unknown_metric: 'hi',
        },
    ]);

    expect(result).toHaveProperty('unknown_metric');
    expect(result.unknown_metric).toEqual([20, 12, 'hi']);
});
