const HttpServer = require('../server/http-server');
jest.mock('../server/http-server');

// Mock HTTP server.
HttpServer.mockImplementation(() => {
    return {
        handler: {
            get: (a, b) => {},
        },
    };
});

it('Ensure spammer calls http server', () => {
    require('../spammer');
    expect(HttpServer).toBeCalledWith('0.0.0.0', 5435);
});
