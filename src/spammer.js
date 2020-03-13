const httpStatus = require('http-status-codes');
const HttpServer = require('./server/http-server');
const configuration = require('./configuration/configuration');
const PerformanceRun = require('./performance/performance-run');
const ClusterHost = require('./cluster/host/cluster-host');

const httpSever = new HttpServer('0.0.0.0', configuration.get('port'));
httpSever.handler.get('/', function(req, res) {
    res.statusCode = httpStatus.CREATED;
    res.end();
});

if (configuration.get('remoteClients') != null) {
    const remoteClientList = configuration.get('remoteClients').split(',');
    const clusterHost = new ClusterHost(remoteClientList);
}

module.exports = httpSever;
