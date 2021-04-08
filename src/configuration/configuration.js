const convict = require('convict');

const config = convict({
    port: {
        doc: 'Port of the spammer server.',
        format: 'port',
        default: 5435,
        env: 'SPAMMER_PORT',
    },
    host: {
        doc: 'Host of the spammer server.',
        format: 'ipaddress',
        default: '0.0.0.0',
        env: 'SPAMMER_HOST',
    },
    spammerType: {
        doc: 'The type of spammer.',
        format: ['leader', 'follower'],
        default: 'leader',
        env: 'SPAMMER_TYPE',
    },
    initialLeaderSocketAddress: {
        doc: '[Optional] The inital leader to connect to.',
        format: String,
        default: '',
        env: 'SPAMMER_INITIAL_LEADER_SOCKET_ADDRESS',
    },
    initialLeaderVersion: {
        doc: '[Optional] The inital leader version.',
        format: String,
        default: '',
        env: 'SPAMMER_INITIAL_LEADER_VERSION',
    },
    databaseUser: {
        doc: '[Optional] The database user name.',
        format: String,
        default: 'spammer',
        env: 'SPAMMER_DATABASE_USER',
    },
    databasePassword: {
        doc: '[Optional] The database password.',
        format: String,
        default: 'spammer',
        env: 'SPAMMER_DATABASE_PASSWORD',
    },
    databaseHost: {
        doc: '[Optional] The database host.',
        format: String,
        default: 'localhost',
        env: 'SPAMMER_DATABASE_HOST',
    },
    databasePort: {
        doc: '[Optional] The database port.',
        format: 'port',
        default: '5432',
        env: 'SPAMMER_DATABASE_PORT',
    },
});

config.validate({ allowed: 'strict' });

module.exports = config;
