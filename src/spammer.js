const HttpServer = require('./server/http-server');
const configuration = require('./configuration/configuration');
const PerformanceRun = require('./performance/performance-run');
const { SpammerHostManager, _ } = require('./cluster/host/spammer-host-manager');
const SpammerHostServer = require('./cluster/host/spammer-host-server');
const SpammerClientHttp = require('./cluster/client/spammer-client-http');

const spammerHostManager = new SpammerHostManager();
const spammerHostServer = new SpammerHostServer('0.0.0.0', configuration.get('port'), spammerHostManager);

module.exports = spammerHostServer;
