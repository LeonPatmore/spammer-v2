const HttpRunConfiguration = require('../../../../../cluster/follower/interfaces/run-configuration/run-configuration-http');
const HttpClient = require('../../../../../http/client');

jest.mock('../../../../../http/client');

it('WHEN http interface run requests THEN interface runs request and increases metrics', async () => {
    const requestMock = jest.fn();
    HttpClient.mockReturnValue({ request: requestMock });
    requestMock.mockResolvedValue({ code: 400, responseTimeMs: 2 });
    const httpRunConfiguration = new HttpRunConfiguration({
        url: 'some-url',
        method: 'some-method',
    });
    const addMetricsValueMock = jest.fn();

    await httpRunConfiguration._getRunRequest()({
        metricsManager: { addMetricValue: addMetricsValueMock },
    });

    expect(requestMock).toBeCalledWith('some-method', 'some-url');
    expect(addMetricsValueMock).toBeCalledWith('response_code', 400);
    expect(addMetricsValueMock).toBeCalledWith('response_time', 2);
});
