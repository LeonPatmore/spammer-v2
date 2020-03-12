const httpStatus = require('http-status-codes');
const HttpServer = require('./server/http-server');
const configuration = require('./configuration/configuration');
const PerformanceRun = require('./performance/performance-run');

console.log('Starting HTTP server...');
const httpSever = new HttpServer('0.0.0.0', configuration.get('port'), function(request, response) {
    response.statusCode = httpStatus.CREATED;
    response.end();
});

module.exports = httpSever;
