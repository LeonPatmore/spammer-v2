const httpStatus = require('http-status-codes');
const HttpServer = require('./server/http-server');
const configuration = require('./configuration/configuration');
const PerformanceRun = require('./performance/performance-run');

// console.log('Starting HTTP server...');
// const httpSever = new HttpServer('0.0.0.0', configuration.get('port'), function(request, response) {
//     response.statusCode = httpStatus.CREATED;
//     response.end();
// });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sayHello() {
    await sleep(8000);
    console.log('HELLO!');
}

const a = new PerformanceRun(sayHello, 3, 2);
a.run().then(a => {
    console.log('All batches have been sent!');
});

// module.exports = httpSever;
