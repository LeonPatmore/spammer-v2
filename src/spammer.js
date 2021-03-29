const configuration = require('./configuration/configuration');
const SpammerFollowerHttp = require('./cluster/follower/spammer-follower-http');
const SpammerLeaderHttp = require('./cluster/leader/spammer-leader-http');
const logger = require('./logger/application-logger');
const { JobsHandledPersistenceNaive } = require('./cluster/follower/jobs-handled-persistence/jobs-handled-persistence');
const { PersistenceClient } = require('./persistence/persistence-client');

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
            const initialLeaderSocketAddress = configuration.get('initialLeaderSocketAddress');
            const initialLeaderVersion = configuration.get('initialLeaderVersion');
            const jobsHandledPersistence = new JobsHandledPersistenceNaive();
            const spammerFollowerHttp = new SpammerFollowerHttp(
                host,
                port,
                jobsHandledPersistence,
                initialLeaderSocketAddress,
                initialLeaderVersion
            );
            this.spammerFollowerHttp = spammerFollowerHttp;
        };

        const loadSpammerLeader = () => {
            const persistenceClient = new PersistenceClient({
                user: configuration.get('databaseUser'),
                password: configuration.get('databasePassword'),
                port: configuration.get('databasePort'),
                host: configuration.get('databaseHost'),
            });
            const spammerLeaderHttp = new SpammerLeaderHttp(host, port, persistenceClient);
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
    async close() {
        if (this.hasOwnProperty('spammerFollowerHttp')) {
            await this.spammerFollowerHttp.close();
        } else if (this.hasOwnProperty('spammerLeaderHttp')) {
            await this.spammerLeaderHttp.close();
        }
    }
}

const spammer = new Spammer(configuration);

module.exports = spammer;
