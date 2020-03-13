const axios = require('axios');

class HttpClient {
    get(url) {
        return axios({
            method: 'get',
            url: url,
        });
    }
}

module.exports = HttpClient;
