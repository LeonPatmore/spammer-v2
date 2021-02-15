const {
    ConnectedLeaders,
    UnknownLeaderError,
    LeaderAlreadyConnected,
} = require('../../../../cluster/follower/connected-leaders/connected-leaders');
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

afterEach(() => {
    connectedLeaders.close();
});

it('Ensure getting a valid connected leader works as expected', async () => {
    await connectedLeaders.addLeader(LEADER_SOCKET_ADDRESS, LEADER_VERSION);

    const leader = connectedLeaders.getLeader(LEADER_UUID);
    expect(leader).toHaveProperty('socketAddress', LEADER_SOCKET_ADDRESS);
    expect(leader).toHaveProperty('uuid', LEADER_UUID);
    expect(leader).toHaveProperty('version', LEADER_VERSION);
});

it('Ensure getting a unknown leader throws unknown leader expection', async () => {
    try {
        await connectedLeaders.getLeader(LEADER_UUID);
    } catch (e) {
        expect(e).toBeInstanceOf(UnknownLeaderError);
        expect(e.message).toEqual('unknown leader with uuid [ leader_uuid ]');
    }
});

it('Ensure adding leader which is already connected thrpws already connected expection', async () => {
    await connectedLeaders.addLeader(LEADER_SOCKET_ADDRESS, LEADER_VERSION);

    try {
        await connectedLeaders.addLeader(LEADER_SOCKET_ADDRESS, LEADER_VERSION);
    } catch (e) {
        expect(e).toBeInstanceOf(LeaderAlreadyConnected);
        expect(e.message).toEqual('leader with id [ leader_uuid ] is already connected!');
    }
});
