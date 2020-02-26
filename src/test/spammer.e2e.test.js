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
    return new Promise(resolve => {
        rest('http://localhost:5435/').then(response => {
            resolve(response);
        });
    });
}

it('Ensure that spammer returns 201', () => {
    return sendRequest().then(response => {
        expect(response.status.code).toEqual(201);
    });
});
