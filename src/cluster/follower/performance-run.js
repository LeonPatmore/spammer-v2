const Repeater = require('../../repeater/repeater');
const MetricsManager = require('../../metrics/metrics-manager');

class PerformanceRun extends Repeater {
    constructor(runRequest, rps, runtimeSeconds) {
        const metricsManager = new MetricsManager();
        const runRequestWithMetrics = async () => {
            try {
                await runRequest({ metricsManager: metricsManager });
                metricsManager.incrementMetric(PerformanceRun.successMetric);
            } catch (e) {
                metricsManager.incrementMetric(PerformanceRun.failedMetric);
            } finally {
                metricsManager.incrementMetric(PerformanceRun.totalMetric);
            }
        };
        super(runRequestWithMetrics, rps, runtimeSeconds);
        this.metricsManager = metricsManager;
    }

    run(onFinish) {
        this.start(() => onFinish(this.metricsManager.metrics));
    }
}

PerformanceRun.successMetric = 'successful_requests';
PerformanceRun.failedMetric = 'failed_requests';
PerformanceRun.totalMetric = 'total_requests';

module.exports = PerformanceRun;