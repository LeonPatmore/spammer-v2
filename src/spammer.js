const configuration = require('./configuration/configuration');
const SpammerFollowerHttp = require('./cluster/follower/spammer-follower-http');
const logger = require('./logger/application-logger');

class Spammer {
    /**
     * Load a spammer instance given the configuration.
     * @param {convict} configuration   A configuration object.
     */
    constructor(configuration) {
        // Load generic configuration.
        const host = configuration.get('host');
        const port = configuration.get('port');
        const leaderOrFollower = configuration.get('spammerType');

        /**
         * Load as a follower.
         */
        const loadSpammerFollower = () => {
            const initialLeaderSocketAddress = configuration.get('initalLeaderSocketAddress');
            const initialLeaderVersion = configuration.get('initialLeaderVersion');
            const spammerFollowerHttp = new SpammerFollowerHttp(
                host,
                port,
                initialLeaderSocketAddress,
                initialLeaderVersion
            );
            this.spammerFollowerHttp = spammerFollowerHttp;
        };

        if (leaderOrFollower == 'leader') {
            logger.info('Loading Spammer as a leader!');
        } else {
            logger.info('Loading Spammer as a follower!');
            loadSpammerFollower();
        }
    }
}

const spammer = new Spammer(configuration);

module.exports = spammer;
