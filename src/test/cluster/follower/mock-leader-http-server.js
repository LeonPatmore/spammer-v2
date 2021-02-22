const ServerMock = require('mock-http-server');
const portfinder = require('portfinder');

let mockPort;
let leaderServer;
const jobs = [];
const leaderJobs = [];

function addLeaderJob(uuid, config, type) {
    leaderJobs.push({
        uuid,
        config,
        type,
    });
}

async function start() {
    await portfinder.getPortPromise().then(freePort => {
        mockPort = freePort;
        return new Promise((resolve, reject) => {
            leaderServer = new ServerMock({ host: '0.0.0.0', port: mockPort });
            leaderServer.start((err, data) => {
                if (err) return reject(data);
                resolve(data);
            });
        });
    });
    leaderServer.on({
        method: 'PUT',
        path: '/v1/follower/status',
        reply: {
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: () => {
                return JSON.stringify({
                    uuid: 'leader-uuid',
                    jobs: leaderJobs,
                });
            },
        },
    });
    leaderServer.on({
        method: 'PUT',
        path: '/v1/job/status',
        reply: {
            status: 200,
            body: (req, _) => {
                jobs.push({
                    follower_uuid: req.body.follower_uuid,
                    job_uuid: req.body.job_uuid,
                    job_status: req.body.job_status,
                    job_result: req.body.job_result,
                });
            },
        },
    });
}

async function stop() {
    await new Promise((resolve, reject) => {
        leaderServer.stop((err, data) => {
            if (err) return reject(data);
            resolve(data);
        });
    });
}

function getPort() {
    if (typeof mockPort !== 'undefined') {
        return mockPort;
    } else {
        throw new Error('Can not get port, has the server been started yet?');
    }
}

function clearJobs() {
    jobs.length = 0;
}

function getJobs() {
    return jobs;
}

module.exports = { start, stop, addLeaderJob, getPort, clearJobs, getJobs };
