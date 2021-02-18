const ServerMock = require('mock-http-server');

const MOCK_PORT = 9000;

const leaderServer = new ServerMock({ host: 'localhost', port: MOCK_PORT });

async function start() {
    await new Promise((resolve, reject) => {
        leaderServer.start(
            (err,
            data => {
                if (err) return reject(data);
                resolve(data);
            })
        );
    });
}

async function stop() {
    await server.stop();
}
