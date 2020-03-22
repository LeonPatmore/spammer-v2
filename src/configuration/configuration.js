const convict = require('convict');

const config = convict({
    port: {
        doc: 'Port of the spammer server.',
        format: 'port',
        default: 5435,
        env: 'SPAMMER_PORT',
    },
    remoteClients: {
        doc: 'If provided, will act as a host for the given clients.',
        default: null,
        env: 'REMOTE_CLIENTS',
    },
});

config.validate({ allowed: 'strict' });

module.exports = config;
