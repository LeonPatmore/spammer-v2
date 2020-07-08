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
        default: 'follower',
        env: 'SPAMMER_TYPE',
    },
});

config.validate({ allowed: 'strict' });

module.exports = config;
