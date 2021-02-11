const { ConnectedLeaders } = require('../../../../cluster/follower/connected-leaders/connected-leaders');
const spammerLeaderClients = require('../../../../cluster/follower/leader-clients/spammer-leader-client');
jest.mock('../../../../cluster/follower/leader-clients/spammer-leader-client');

const LEADER_UUID = 'leader_uuid';
const LEADER_SOCKET_ADDRESS = 'host:1234';
const LEADER_VERSION = 'v1';
let connectedLeaders;

beforeEach(() => {
    spammerLeaderClients.v1.updateLeader.mockImplementation(() => {
        return {
            uuid: LEADER_UUID,
        };
    });
    connectedLeaders = new ConnectedLeaders(
        {
            uuid: 'some-uuid',
        },
        {
            status: 'some-status',
            available: true,
        }
    );
});

it('Ensure adding and getting connected leader works', async () => {
    await connectedLeaders.addLeader(LEADER_SOCKET_ADDRESS, LEADER_VERSION);

    const leader = connectedLeaders.getLeader(LEADER_UUID);
    expect(leader).toHaveProperty('socketAddress', LEADER_SOCKET_ADDRESS);
    expect(leader).toHaveProperty('uuid', LEADER_UUID);
    expect(leader).toHaveProperty('version', LEADER_VERSION);
});
