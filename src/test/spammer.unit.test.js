const SpammerFollowerHttp = require('../cluster/follower/spammer-follower-http');
const SpammerLeaderHttp = require('../cluster/leader/spammer-leader-http');
const Configuration = require('../configuration/configuration');
jest.mock('../cluster/follower/spammer-follower-http');
jest.mock('../cluster/leader/spammer-leader-http');
jest.mock('../configuration/configuration');

const configuration = {
    host: '0.0.0.0',
    port: 1234,
};

let spammer;

afterEach(() => {
    spammer.close();
});

it('Ensure spammer loads leader with correct values', () => {
    Configuration.get.mockImplementation(param => {
        if (param == 'spammerType') return 'leader';
        return configuration[param];
    });
    jest.isolateModules(() => {
        spammer = require('../spammer');
    });
    expect(SpammerLeaderHttp).toBeCalledWith('0.0.0.0', 1234);
});

it('Ensure spammer loads follower with correct values', () => {
    Configuration.get.mockImplementation(param => {
        if (param == 'spammerType') return 'follower';
        return configuration[param];
    });
    jest.isolateModules(() => {
        spammer = require('../spammer');
    });
    expect(SpammerFollowerHttp).toBeCalledWith('0.0.0.0', 1234, undefined, undefined);
});

it('Ensure spammer loads follower with correct initial leader values', () => {
    Configuration.get.mockImplementation(param => {
        if (param == 'spammerType') return 'follower';
        if (param == 'initialLeaderSocketAddress') return 'initial.socket.address:1234';
        if (param == 'initialLeaderVersion') return 'v1';
        return configuration[param];
    });
    jest.isolateModules(() => {
        spammer = require('../spammer');
    });
    expect(SpammerFollowerHttp).toBeCalledWith('0.0.0.0', 1234, 'initial.socket.address:1234', 'v1');
});
