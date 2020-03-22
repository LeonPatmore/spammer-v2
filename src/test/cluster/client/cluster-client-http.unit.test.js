const ClusterClientHttp = require('../../../cluster/client/cluster-client-http');
const HttpServer = require('../../../server/http-server');
jest.mock('../../../server/http-server');

it('Ensure that link returns bad request when no host id provided', () => {
    const httpServer = new HttpServer();
    const myClient = new ClusterClientHttp(httpServer);
    const statusFunction = jest.fn();
    statusFunction.mockReturnValue({ json: jest.fn() });
    myClient.linkHostRequestHandler({ body: {} }, { status: statusFunction, end: jest.fn() });

    expect(statusFunction.mock.calls.length).toEqual(1);
    expect(statusFunction.mock.calls[0][0]).toEqual(400);
});
