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

    /**
     * Close the persistence client, including all connections if applicable.
     */
    async close() {
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
        if (column != 'id' && this.columns.indexOf(column) < 0)
            throw new Error(`The table [ ${this.name} ] does not contain the column [ ${column} ]`);
    }

    /**
     * Get a list of matching rows given the column and the value.
     * @param {String} column   The column to match.
     * @param {String} value    The value to match.
     * @returns                 A list of rows that have matched.
     */
    async getByColumn(column, value) {
        this._validateColumn(column);
        return await this._getByColumnImplementation(column, value);
    }

    async _getByColumnImplementation(column, value) {
        throw new NotImplementedError();
    }

    /**
     * Return all of the values in this table.
     */
    async getAll() {
        throw new NotImplementedError();
    }

    /**
     * Add a data entry to this table.
     * @param {Array} values    An array of values to add.
     * @param {Array} columns   An array of columns to add the values.
     */
    async addEntry(values, columns = this.columns) {
        columns.forEach(element => {
            this._validateColumn(element);
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
        this._validateColumn(column);
        return await this._incrementValueImplementation(column, id, value);
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
        this._validateColumn(column);
        return await this._getPercentileOfColumnImplementation(column, percentile);
    }

    async _getPercentileOfColumnImplementation(column, percentile) {
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

    async close() {
        await this.client.end();
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
            `insert into "${this.name}" (${columns.toString()}) values (${valuesString.toString()});`
        );
    }

    async _incrementValueImplementation(column, id, value) {
        await this.client.query(
            `insert into "${this.name}" as tbl (id, ${column}) values ('${id}', '${value}') ON CONFLICT (id) DO UPDATE SET ${column}=tbl.${column}+${value};`
        );
    }

    async _getPercentileOfColumnImplementation(column, percentile) {
        return this.client
            .query(
                `select percentile_disc(${percentile}) within group (order by ${this.name}.${column}) from "${this.name}";`
            )
            .then(result => {
                return result.rows['0']['percentile_disc'];
            });
    }

    async _getByColumnImplementation(column, value) {
        return this.client.query(`SELECT * FROM "${this.name}";`).then(res => {
            return res['rows'];
        });
    }

    async getAll() {
        return this.client.query(`SELECT * FROM "${this.name}"`).then(res => {
            return res['rows'];
        });
    }
}

module.exports = { PersistenceClient: PostgresClient };
