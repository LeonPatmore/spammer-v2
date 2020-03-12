const httpStatus = require('http-status-codes');
const HttpServer = require('./server/http-server');
const configuration = require('./configuration/configuration');
const PerformanceRun = require('./performance/performance-run');

console.log('Starting HTTP server...');
const httpSever = new HttpServer('0.0.0.0', configuration.get('port'));
httpSever.handler.get('/', function(req, res) {
    res.statusCode = httpStatus.CREATED;
    res.end();
});

module.exports = httpSever;
