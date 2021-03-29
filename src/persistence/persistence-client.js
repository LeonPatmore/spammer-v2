const { Client } = require('pg');
const applicationLogger = require('../logger/application-logger');
const NotImplementedError = require('../utils/not-implemented-error');

class PersistenceClient {
    /**
     * Create a new table for this persistence. If the table already exists, return this table.
     * @param {String} tableName    Name of the table.
     * @param {Array} columns       An array for column names to create for the table/
     * @param {Array} datatypes     An array of datatypes for the columns.
     */
    async createTable(tableName, columns, datatypes) {
        throw new NotImplementedError();
    }
}

class PersistenceTable {
    /**
     * @param {String} name     Name of the table.
     * @param {Array} columns   An array for columns that this table has.
     */
    constructor(name, columns) {
        this.name = name;
        this.columns = columns;
    }

    _validateColumn(column) {
        if (this.columns.indexOf(column) < 0) throw new Error(`The table does not contain the column [ ${element} ]`);
    }

    /**
     * Add a data entry to this table.
     * @param {Array} values    An array of values to add.
     * @param {Array} columns   An array of columns to add the values.
     */
    async addEntry(values, columns = this.columns) {
        columns.forEach(element => {
            this._validateColumn();
        });
        await this._addEntryImplementation(values, columns);
    }

    async _addEntryImplementation(values, columns) {
        throw new NotImplementedError();
    }

    /**
     * Increment a value in this table. TODO
     * @param {String} column
     * @param {Number} id
     * @param {Number} value
     * @returns
     */
    async incrementValue(column, id, value) {
        this._validateColumn();
        return await this.incrementValueImplementation(column, id, value);
    }

    async _incrementValueImplementation(column, id, value) {
        throw new NotImplementedError();
    }

    /**
     * Get the percentile of the column in this table.
     * @param {String} column
     * @param {Number} percentile
     */
    async getPercentileOfColumn(column, percentile) {
        throw new NotImplementedError();
    }
}

class PostgresClient extends PersistenceClient {
    constructor(configuration) {
        super();
        this.client = new Client({
            user: configuration['user'],
            database: 'spammer',
            host: configuration['host'],
            port: configuration['port'],
            password: configuration['password'],
        });
        this.client.connect();
    }

    async createTable(tableName, columns, datatypes) {
        let tableRows = '';
        columns.forEach((column, n) => {
            tableRows = tableRows + `, ${column} ${datatypes[n]}`;
        });
        applicationLogger.info(`Creating table with name [ ${tableName} ]`);
        await this.client.query(`create table if not exists "${tableName}" ( id serial PRIMARY KEY ${tableRows} );`);
        return new PostgresTable(tableName, columns, this.client);
    }
}

class PostgresTable extends PersistenceTable {
    constructor(name, columns, client) {
        super(name, columns);
        this.client = client;
    }

    async _addEntryImplementation(values, columns) {
        const valuesString = values.map(value => {
            if (value instanceof String || typeof value == 'string') return `'${value}'`;
            return value;
        });
        await this.client.query(
            `insert into ${this.name} (${columns.toString()}) values (${valuesString.toString()});`
        );
    }

    async _incrementValueImplementation(column, id, value) {
        await this.client.query(`update ${this.name} set ${column} = ${column} + ${value} where id = ${id};`);
    }

    async getPercentileOfColumn(column, percentile) {
        return this.client
            .query(
                `select percentile_disc(${percentile}) within group (order by ${this.name}.${column}) from ${this.name}`
            )
            .then(result => {
                return result.rows['0']['percentile_disc'];
            });
    }
}

module.exports = { PersistenceClient: PostgresClient };
