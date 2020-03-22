const { ClusterClient, ClientAlreadyLinkedError } = require('./cluster-client');
const httpStatus = require('http-status-codes');

class ClusterClientHttp extends ClusterClient {
    constructor(httpServer) {
        super();

        this.getLinkRequestHandler = (_, res) => {
            if (this.isLinked()) {
                res.json({
                    host_id: this.linkedHostId,
                }).end();
            } else {
                res.status(httpStatus.NOT_FOUND).end();
            }
        };

        this.linkHostRequestHandler = (req, res) => {
            const requestBody = req.body;
            if (!requestBody.hasOwnProperty('host_id')) {
                res.status(httpStatus.BAD_REQUEST).json({
                    error: 'Field `host_id` is required.',
                });
            } else {
                try {
                    this.linkHost(requestBody.host_id);
                } catch (e) {
                    if (e instanceof ClientAlreadyLinkedError) {
                        res.status(httpStatus.BAD_REQUEST).json({
                            error: 'Client is already linked to a host.',
                        });
                    } else {
                        throw e;
                    }
                }
            }
            res.end();
        };

        httpServer.addGetHandler('/link', this.getLinkRequestHandler);
        httpServer.addPostHandler('/link', this.linkHostRequestHandler);
    }
}

module.exports = ClusterClientHttp;
