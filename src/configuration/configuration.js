const convict = require('convict');

const config = convict({
    port: {
        doc: 'Port of the spammer server.',
        format: 'port',
        default: 5435,
        env: 'SPAMMER_PORT',
    },
});

config.validate({ allowed: 'strict' });

module.exports = config;
