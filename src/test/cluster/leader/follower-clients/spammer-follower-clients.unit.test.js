/**
 * @jest-environment node
 */

const { v1 } = require('../../../../cluster/leader/follower-clients/spammer-follower-clients');
const axios = require('axios');
jest.mock('axios');

describe('V1 Tests', () => {
    it('Test connect to follower WHEN successful THEN responds ok with uuid', async () => {
        axios.mockResolvedValue({
            status: 200,
            data: {
                uuid: 'uuid',
            },
        });
        const id = await v1.connectToFollower('someSocketAddress');
        expect(id).toEqual('uuid');
    });

    it('Test connect to follower WHEN 400 response THEN throw an error', async () => {
        axios.mockResolvedValue({
            status: 400,
        });
        await expect(v1.connectToFollower('someSocketAddress')).rejects.toBeInstanceOf(Error);
    });

    it('Test running performance test WHEN 200 response THEN responds true', async () => {
        axios.mockResolvedValue({
            status: 200,
        });
        expect(await v1.runningPerformanceRun('someSocketAddress')).toEqual(true);
    });

    it('Test running performance test WHEN 404 response THEN responds false', async () => {
        axios.mockResolvedValue({
            status: 404,
        });
        expect(await v1.runningPerformanceRun('someSocketAddress')).toEqual(false);
    });

    it('Test running performance test WHEN 500 response THEN throw an error', async () => {
        axios.mockResolvedValue({
            status: 500,
        });
        await expect(v1.runningPerformanceRun('someSocketAddress')).rejects.toBeInstanceOf(Error);
    });

    it('Test start performance test WHEN 400 response THEN throw an error', async () => {
        axios.mockResolvedValue({
            status: 500,
        });
        await expect(v1.startPerformanceRun('someSocketAddress', 'someId', 0)).rejects.toBeInstanceOf(Error);
    });

    it('Test stop performance test WHEN 400 response THEN throw an error', async () => {
        axios.mockResolvedValue({
            status: 500,
        });
        await expect(v1.stopPerformanceRun('someSocketAddress', 'someId')).rejects.toBeInstanceOf(Error);
    });
});
