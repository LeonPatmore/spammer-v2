const rest = require('rest');

let spammer;

beforeAll(() => {
    // Start spammer.
    spammer = require('../spammer');
});

afterAll(() => {
    spammer.closeServer();
});

function sendRequest() {
    return rest('http://localhost:5435/');
}

it('Ensure that spammer returns 201', async () => {
    const response = await sendRequest();
    expect(response.status.code).toEqual(201);
});
