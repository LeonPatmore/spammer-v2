const each = require('jest-each').default;
const sleep = require('../../utils/sleep');

each([50, 500, 100]).it('Ensure sleep sleeps for the correct amount of time.', async timeout => {
    const startTime = new Date().getTime();
    await sleep(timeout);
    const milliesTaken = new Date().getTime() - startTime;
    expect(milliesTaken).toBeGreaterThanOrEqual(timeout);
});
