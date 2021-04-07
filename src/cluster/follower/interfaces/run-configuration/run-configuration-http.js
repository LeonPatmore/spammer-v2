const HttpClient = require('../../../../http/client');
const logger = require('../../../../logger/application-logger');
const RunConfiguration = require('./run-configuration');

class HttpRunConfiguration extends RunConfiguration {
    constructor(config, metricsConfig) {
        super(config, metricsConfig);
        // TODO check properties exist.
        this.url = config.url;
        this.method = config.method;
        this.httpClient = new HttpClient();
    }
    _getRunRequest() {
        return async config => {
            logger.info(`Sending request to URL [ ${this.url} ] with method [ ${this.method} ]`);
            const result = await this.httpClient.request(this.method, this.url);
            config.metricsManager.addMetricValue('http_response', {
                time: result.responseTimeMs,
                code: result.code,
            });
        };
    }
}

module.exports = HttpRunConfiguration;
