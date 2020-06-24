const ClusterClientHttp = require('../../../cluster/client/cluster-client-http');
const HttpServer = require('../../../server/http-server');
jest.mock('../../../server/http-server');

let clusterClientHttp;

beforeEach(() => {
    const httpServer = new HttpServer();
    clusterClientHttp = new ClusterClientHttp(httpServer);
});

it('Ensure that link returns bad request when no host id provided', () => {
    const statusFunction = jest.fn();
    statusFunction.mockReturnValue({ json: jest.fn() });
    clusterClientHttp.linkHostRequestHandler({ body: {} }, { status: statusFunction, end: jest.fn() });

    expect(statusFunction.mock.calls.length).toEqual(1);
    expect(statusFunction.mock.calls[0][0]).toEqual(400);
});

it('Ensure that get link returns the host ID when it is defined', () => {
    clusterClientHttp.linkHost('someHost');
    const jsonFunction = jest.fn();
    jsonFunction.mockReturnValue({ end: jest.fn() });

    clusterClientHttp.getLinkRequestHandler(undefined, { json: jsonFunction });

    expect(jsonFunction.mock.calls.length).toEqual(1);
    expect(jsonFunction.mock.calls[0][0]).toEqual({
        host_id: 'someHost',
    });
});

it('Ensure that get link returns 404 when it is not defined', () => {
    const statusFunction = jest.fn();
    statusFunction.mockReturnValue({ end: jest.fn() });

    clusterClientHttp.getLinkRequestHandler(undefined, { status: statusFunction });

    expect(statusFunction.mock.calls.length).toEqual(1);
    expect(statusFunction.mock.calls[0][0]).toEqual(404);
});
