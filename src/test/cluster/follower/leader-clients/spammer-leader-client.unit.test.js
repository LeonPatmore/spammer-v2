/**
 * @jest-environment node
 */

const { v1 } = require('../../../../cluster/follower/leader-clients/spammer-leader-client');
const axios = require('axios');
jest.mock('axios');

describe('V1 Tests', () => {
    it('Test update leader WHEN 400 from leader THEN throw error', async () => {
        axios.mockResolvedValue({
            status: 400,
        });
        await expect(v1.updateLeader('socket-address', 'uuid', 'some-status', false)).rejects.toBeInstanceOf(Error);
    });

    it('Test update leader WHEN successful', async () => {
        axios.mockResolvedValue({
            status: 200,
            data: {
                uuid: 'leader-uuid',
                jobs: [
                    {
                        uuid: 'job-uuid',
                        config: 'some-config',
                        type: 'some-type',
                    },
                ],
            },
        });

        const response = await v1.updateLeader('socket-address', 'uuid', 'some-status', false);
        expect(response.uuid).toEqual('leader-uuid');
        expect(response.jobs).toHaveLength(1);
        console.log(response.jobs);
        expect(response.jobs[0].uuid).toEqual('job-uuid');
        expect(response.jobs[0].config).toEqual('some-config');
        expect(response.jobs[0].type).toEqual('some-type');
    });

    it('Test update job status WHEN 400 from leader THEN throw error', async () => {
        axios.mockResolvedValue({
            status: 400,
        });
        await expect(
            v1.updateJobStatus('socket-address', 'follower-id', 'job-id', 'some-status')
        ).rejects.toBeInstanceOf(Error);
    });

    it('Test update job status WHEN successful', async () => {
        axios.mockResolvedValue({
            status: 200,
        });
        await v1.updateJobStatus('socket-address', 'follower-id', 'job-id', 'some-status');
    });
});
