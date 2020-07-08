const SpammerFollowerHttp = require('../cluster/follower/spammer-follower-http');
const Configuration = require('../configuration/configuration');
jest.mock('../cluster/follower/spammer-follower-http');
jest.mock('../configuration/configuration');

const configuration = {
    host: '0.0.0.0',
    port: 1234,
    spammerType: 'follower',
    initalLeaderSocketAddress: null,
    initialLeaderVersion: null,
};

let spammer;

afterEach(() => {
    spammer.close();
});

beforeEach(() => {
    Configuration.get.mockImplementation(param => {
        return configuration[param];
    });
    spammer = require('../spammer');
});

it('Ensure spammer loads follower with correct values', () => {
    expect(SpammerFollowerHttp).toBeCalledWith('0.0.0.0', 1234);
});
