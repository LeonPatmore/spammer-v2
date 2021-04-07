const applicationLogger = require('../logger/application-logger');
const metricTypes = require('./metric-types');

function getColumnsForType(config) {
    const type = config.type;
    switch (type) {
        case metricTypes.CONSTANT:
            return { names: ['constant'], dataTypes: ['text'] };
        case metricTypes.PER_REQUEST_VALUE:
            return { names: Object.keys(config.parts), dataTypes: Object.values(config.parts) };
        case metricTypes.ROLLING_TOTAL:
            return { names: ['constant'], dataTypes: ['real'] };
        case metricTypes.PERCENTILE:
        case metricTypes.CALCULATION:
            return { names: ['constant'], dataTypes: ['real'] };
        default:
            throw new Error(`Not sure how to get columns for metric type [ ${type} ]`);
    }
}

class MetricsStore {
    constructor(uuid, persistenceClient, metricsConfig) {
        this.uuid = uuid;
        this.persistenceClient = persistenceClient;
        this.tables = {};

        const getMetricTableName = name => {
            return `${this.uuid.substring(0, 8)}_${name}`;
        };

        new Map(Object.entries(metricsConfig)).forEach((metricConfig, metricName) => {
            const { names, dataTypes } = getColumnsForType(metricConfig);
            this.persistenceClient
                .createTable(getMetricTableName(metricName), names, dataTypes)
                .then(table => {
                    this.tables[metricName] = table;
                })
                .catch(err => {
                    applicationLogger.warn(`Could not create table due to [ ${err} ]`);
                });
        });
    }

    _getTableForMetric(metricName) {
        if (this.tables.hasOwnProperty(metricName)) {
            return this.tables[metricName];
        } else {
            throw new Error(`This store does not support the metric with name [ ${metricName} ]`);
        }
    }

    async getConstant(metricName) {
        return this._getTableForMetric(metricName)
            .getByColumn('id', 0)
            .then(result => {
                if (result.length <= 0) {
                    applicationLogger.info(
                        `Can not get constant for [ ${metricName} ] since there is no row with id 0!`
                    );
                    return 0;
                }
                return result[0]['constant'];
            });
    }

    async getAllValues(metricName) {
        return this._getTableForMetric(metricName)
            .getAll()
            .then(allValues => {
                return allValues.map(value => {
                    delete value.id;
                    return value;
                });
            });
    }

    async insertConstant(metricName, constant) {
        await this._getTableForMetric(metricName).addEntry([0, constant], ['id', 'constant']);
    }

    async addPerRequestValue(metricName, values, parts) {
        await this._getTableForMetric(metricName).addEntry(values, parts);
    }

    async addRollingTotal(metricName, value) {
        await this._getTableForMetric(metricName).incrementValue('constant', 0, value);
    }

    async calculateAndPersistPercentile(metricName, targetMetric, targetPart, percentile) {
        const percentileNum =
            (await this._getTableForMetric(targetMetric).getPercentileOfColumn(targetPart, percentile)) || 0;
        await this._getTableForMetric(metricName).addEntry([0, percentileNum], ['id', 'constant']);
        return percentileNum;
    }
}

module.exports = MetricsStore;
