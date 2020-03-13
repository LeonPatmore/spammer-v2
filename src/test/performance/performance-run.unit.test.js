const PerformanceRun = require('../../performance/performance-run');

it('Ensure that performance run sends the correct amount of requests and calls finish', async () => {
    // Setup performance run with mock counter.
    const myRequestFunction = jest.fn();
    const myRun = new PerformanceRun(myRequestFunction, 2, 2);
    const myFinishFunction = jest.fn();

    // Run performance test.
    await myRun.run(myFinishFunction);

    // Ensure counter was called correct amount of times.
    expect(myRequestFunction.mock.calls.length).toEqual(4);
    // Ensure finish function is called.
    expect(myFinishFunction.mock.calls.length).toEqual(1);
});
