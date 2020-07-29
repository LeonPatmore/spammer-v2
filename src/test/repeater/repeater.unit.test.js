const Repeater = require('../../repeater/repeater');

it('Ensure that the repeater sends the correct amount of requests and calls finish', async () => {
    // Setup performance run with mock counter.
    const myRequestFunction = jest.fn();
    const myRepeater = new Repeater(myRequestFunction, 2, 2);
    const myFinishFunction = jest.fn();

    // Run repeater.
    await myRepeater.start(myFinishFunction);

    // Ensure counter was called correct amount of times.
    expect(myRequestFunction.mock.calls.length).toEqual(4);
    // Ensure finish function is called.
    expect(myFinishFunction.mock.calls.length).toEqual(1);
});
