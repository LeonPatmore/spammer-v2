const HttpServer = require('../server/http-server');
jest.mock('../server/http-server');

it('Ensure spammer calls http server', () => {
    require('../spammer');
    expect(HttpServer).toBeCalledWith('localhost', 5435, expect.anything());
});
