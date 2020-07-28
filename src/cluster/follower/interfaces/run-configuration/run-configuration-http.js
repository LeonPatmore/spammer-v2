const HttpClient = require('../../../../http/client');
const logger = require('../../../../logger/application-logger');
const RunConfiguration = require('./run-configuration');

class HttpRunConfiguration extends RunConfiguration {
    constructor(config) {
        super(config);
        // TODO check properties exist.
        this.url = config.url;
        this.method = config.method;
        this.httpClient = new HttpClient();
    }
    _getRunRequest() {
        return config => {
            logger.info(`Sending request to URL [ ${this.url} ] with method [ ${this.method} ]`);
            config.metricsManager.addMetricValue('response_code', 200);
        };
    }
}

module.exports = HttpRunConfiguration;
