const rest = require('rest');

// Start spammer.
require('../spammer');

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
