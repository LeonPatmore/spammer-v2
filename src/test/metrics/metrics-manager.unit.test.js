const MetricsManager = require('../../metrics/metrics-manager');
const metricTypes = require('../../metrics/metric-types');

describe('Constructor metrics', () => {
    it('WHEN init a constant metric THEN the value is undefined', () => {
        const metricsManager = new MetricsManager({
            metrics: [{ name: 'some_name', type: metricTypes.CONSTANT }],
        });

        expect(metricsManager.metrics).toHaveProperty('some_name');
        expect(metricsManager.metrics.some_name).toEqual(undefined);
    });
    it('WHEN init a per request value metric THEN the value is an empty array', () => {
        const metricsManager = new MetricsManager({
            metrics: [{ name: 'some_name', type: metricTypes.PER_REQUEST_VALUE }],
        });

        expect(metricsManager.metrics).toHaveProperty('some_name');
        expect(metricsManager.metrics.some_name).toEqual([]);
    });
    it('WHEN init a rolling total THEN the value is 0', () => {
        const metricsManager = new MetricsManager({
            metrics: [{ name: 'some_name', type: metricTypes.ROLLING_TOTAL }],
        });

        expect(metricsManager.metrics).toHaveProperty('some_name');
        expect(metricsManager.metrics.some_name).toEqual(0);
    });
    it('WHEN init an unknown metric type THEN throw error', () => {
        expect(() => {
            new MetricsManager({
                metrics: [{ name: 'some_name', type: 'some-unknown-type' }],
            });
        }).toThrowError();
    });
});

describe('Non constructor metrics', () => {
    let metricsManager;

    beforeEach(() => {
        metricsManager = new MetricsManager();
    });

    describe('New metrics', () => {
        it('WHEN increment new metric THEN the value is 1', () => {
            metricsManager.incrementMetric('some_metric');

            expect(metricsManager.metrics).toHaveProperty('some_metric');
            expect(metricsManager.metrics.some_metric).toEqual(1);
        });

        it('WHEN add metric value to a new metric THEN the value is a list with the one value', () => {
            metricsManager.addMetricValue('some_metric', 'some-value');

            expect(metricsManager.metrics).toHaveProperty('some_metric');
            expect(metricsManager.metrics.some_metric).toEqual(['some-value']);
        });
    });

    describe('Existing metrics', () => {
        it('WHEN incrementing an existing metric THEN the value is incremented', () => {
            metricsManager.metrics.some_metric = 5;

            metricsManager.incrementMetric('some_metric');

            expect(metricsManager.metrics.some_metric).toEqual(6);
        });

        it('WHEN adding a metric value to an existing metric THEN the value is added to the end of the array', () => {
            metricsManager.metrics.some_metric = [5, 'hi'];

            metricsManager.addMetricValue('some_metric', 'some-value');

            expect(metricsManager.metrics).toHaveProperty('some_metric');
            expect(metricsManager.metrics.some_metric).toEqual([5, 'hi', 'some-value']);
        });
    });
});
