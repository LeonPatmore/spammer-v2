const metricsCombiner = require('../../metrics/metrics-combiner');

it('Test single result with default configs', () => {
    const result = metricsCombiner({}, [
        {
            successful_requests: 20,
            failed_requests: 15,
            total_requests: 17,
        },
    ]);

    expect(result).toHaveProperty('successful_requests');
    expect(result.successful_requests).toEqual(20);
    expect(result).toHaveProperty('failed_requests');
    expect(result.failed_requests).toEqual(15);
    expect(result).toHaveProperty('total_requests');
    expect(result.total_requests).toEqual(17);
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
