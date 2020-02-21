const assert = require('chai').assert;
const app = require('../main');

describe('App', function() {
    it('App should return hello', function() {
        assert.equal(app(), 'hello');
    });
});
