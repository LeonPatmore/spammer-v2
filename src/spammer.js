const httpStatus = require('http-status-codes');
const HttpServer = require('./server/http-server');

console.log('Starting HTTP server...');
const httpSever = new HttpServer('0.0.0.0', 5435, function(request, response) {
    response.statusCode = httpStatus.CREATED;
    response.end();
});
