const RunConfiguration = require('./run-configuration');
const HttpRunConfiguration = require('./run-configuration-http');
const logger = require('../../../../logger/application-logger');

// class RequesterInterfaceNotRecognised extends Error {
//     constructor(interfaceName) {
//         super(`requester interface with name ${interfaceName} is not recognised!`);
//     }
// }

// class InterfacePropetyMissing extends Error {
//     constructor(interfaceProperty) {
//         super(`interface is missing property ${interfaceProperty}`);
//     }
// }

const runConfigurations = {
    http: HttpRunConfiguration,
    default: RunConfiguration,
};

function getRunConfiguration(config) {
    const configurationName = config.interface || 'default';
    logger.info(`Using run configuration with name [ ${configurationName} ]`);
    return new runConfigurations[configurationName](config);
}

module.exports = getRunConfiguration;
