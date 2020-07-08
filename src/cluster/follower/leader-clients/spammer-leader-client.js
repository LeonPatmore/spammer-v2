const httpClient = require('../../../http/client').getInstance();
const UuidAlreadyConnectedToLeaderError = require('./spammer-leader-errors');
const HttpStatusCodes = require('http-status-codes');

class SpammerLeaderClientV1 {
    /**
     * Connect to a Spammer leader instance.
     * @param {string} uuid             The UUID of the follower to connect with.
     * @param {string} socketAddress    The socket address of the follower.
     */
    static async connectToLeader(uuid, socketAddress) {
        await httpClient
            .post('/v1/connect', {
                uuid: uuid,
                socket_address: socketAddress,
            })
            .then(code => {
                if (code == HttpStatusCodes.BAD_REQUEST) {
                    throw new UuidAlreadyConnectedToLeaderError(uuid);
                }
            });
    }
}

module.exports = {
    v1: SpammerLeaderClientV1,
};
