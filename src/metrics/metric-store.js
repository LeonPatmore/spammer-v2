const { Client } = require('pg');

class MetricsStorePostgres {
    constructor(configuration) {
        this.client = new Client({
            user: configuration.get('databaseUser'),
            database: 'spammer',
            host: configuration.get('databaseHost'),
            port: configuration.get('databasePort'),
            password: configuration.get('databasePassword'),
        });
        this.client.connect();
    }

    init(config) {
        // TODO
    }

    insertConstant() {
        // TODO
    }

    addPerRequestValue() {
        // TODO
    }

    addRollingTotal() {
        // TODO
    }
}
