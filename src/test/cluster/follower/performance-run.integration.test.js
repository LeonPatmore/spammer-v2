const PerformanceRun = require('../../../cluster/follower/performance-run');
const sleep = require('../../../utils/sleep');

it('Test positive performance run', async () => {
    const performanceRun = new PerformanceRun(async () => await sleep(1), 2, 2);

    const result = await new Promise(resolve => {
        performanceRun.run(res => resolve(res));
    });

    expect(result).toHaveProperty('successful_requests');
    expect(result.successful_requests).toEqual(4);
    expect(result).toHaveProperty('total_requests');
    expect(result.total_requests).toEqual(4);
});

it('Test negative performance run', async () => {
    const performanceRun = new PerformanceRun(
        async () => {
            throw new Error('some-error');
        },
        2,
        2
    );

    const result = await new Promise(resolve => {
        performanceRun.run(res => resolve(res));
    });

    expect(result).toHaveProperty('failed_requests');
    expect(result.failed_requests).toEqual(4);
    expect(result).toHaveProperty('total_requests');
    expect(result.total_requests).toEqual(4);
});
