const httpStatus = require('http-status-codes');
const HttpServer = require('./server/http-server');
const configuration = require('./configuration/configuration');
const PerformanceRun = require('./performance/performance-run');
const ClusterHost = require('./cluster/host/cluster-host');
const SpammerClientHttp = require('./cluster/client/spammer-client-http');

const httpSever = new HttpServer('0.0.0.0', configuration.get('port'));

if (configuration.get('remoteClients') != null) {
    const remoteClientList = configuration.get('remoteClients').split(',');
    const clusterHost = new ClusterHost(remoteClientList);
} else {
    const clusterClient = new SpammerClientHttp(httpSever);
}

module.exports = httpSever;
