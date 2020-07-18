const configuration = require('./configuration/configuration');
const SpammerFollowerHttp = require('./cluster/follower/spammer-follower-http');
const SpammerLeaderHttp = require('./cluster/leader/spammer-leader-http');
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

        logger.info(leaderOrFollower);

        /**
         * Load as a follower.
         */
        const loadSpammerFollower = () => {
            const spammerFollowerHttp = new SpammerFollowerHttp(host, port);
            this.spammerFollowerHttp = spammerFollowerHttp;
        };

        const loadSpammerLeader = () => {
            const spammerLeaderHttp = new SpammerLeaderHttp(host, port);
            this.spammerLeaderHttp = spammerLeaderHttp;
        };

        if (leaderOrFollower == 'leader') {
            logger.info('Loading Spammer as a leader!');
            loadSpammerLeader();
        } else {
            logger.info('Loading Spammer as a follower!');
            loadSpammerFollower();
        }
    }
    /**
     * Close the Spammer, closing any dependencies it may have.
     */
    close() {
        if (this.hasOwnProperty('spammerFollowerHttp')) {
            this.spammerFollowerHttp.close();
        }
    }
}

const spammer = new Spammer(configuration);

module.exports = spammer;
