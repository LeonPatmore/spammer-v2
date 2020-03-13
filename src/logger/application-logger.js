const logger = require('./logger');
const applicationLogger = logger.child({ type: 'application' });

module.exports = applicationLogger;
