const rest = require('rest');

let spammer;

afterAll(() => {
    spammer.closeServer();
});

function sendRequest() {
    return rest('http://localhost:5435/');
}

it('Ensure that spammer returns 201', async () => {
    spammer = require('../spammer');
    const response = await sendRequest();
    expect(response.status.code).toEqual(201);
});
