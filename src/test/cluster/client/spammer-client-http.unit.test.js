const SpammerClientHttp = require('../../../cluster/client/spammer-client-http');
const HttpServer = require('../../../server/http-server');
jest.mock('../../../server/http-server');

let spammerClientHttp;

beforeAll(() => {
    spammerClientHttp = new SpammerClientHttp(new HttpServer());
});

it('Ensure that get run endpoint returns 404 when spammer is not currently running. ', () => {
    const statusFunction = jest.fn();
    statusFunction.mockReturnValue();

    spammerClientHttp.getRunHandler({ body: {} }, { status: statusFunction, end: jest.fn() });

    expect(statusFunction.mock.calls.length).toEqual(1);
    expect(statusFunction.mock.calls[0][0]).toEqual(404);
});

it('Ensure that post run endpoint returns 400 when no run id is provided.', () => {
    const statusFunction = jest.fn();
    statusFunction.mockReturnValue({ json: jest.fn() });

    spammerClientHttp.postRunHandler({ body: {} }, { status: statusFunction, end: jest.fn() });

    expect(statusFunction.mock.calls.length).toEqual(1);
    expect(statusFunction.mock.calls[0][0]).toEqual(400);
});

it('Ensure that post run endpoint returns 200 given a valid request, and a get request shows the correct id.', () => {
    const postStatusFunction = jest.fn();
    postStatusFunction.mockReturnValue({ json: jest.fn() });
    const runId = 'someId';

    spammerClientHttp.postRunHandler({ body: { run_id: runId } }, { status: postStatusFunction, end: jest.fn() });

    expect(postStatusFunction.mock.calls.length).toEqual(0);

    const getStatusFunction = jest.fn();
    const getJsonFunction = jest.fn();

    spammerClientHttp.getRunHandler({ body: {} }, { status: getStatusFunction, json: getJsonFunction, end: jest.fn() });

    expect(getStatusFunction.mock.calls.length).toEqual(0);
    expect(getJsonFunction.mock.calls.length).toEqual(1);
    expect(getJsonFunction.mock.calls[0][0]).toEqual({ run_id: runId });
});
