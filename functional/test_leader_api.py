from time import sleep

import pytest
import requests

from config_loader import LEADER_URL, FOLLOWER_URL
from global_fixtures import leader_uuid
from url_utils import url_with_path


_leader_uuid = leader_uuid


@pytest.fixture
def _given_one_follower(request, _leader_uuid):
    def fin():
        requests.delete(url_with_path(FOLLOWER_URL, 'v1/leader/{}'.format(_leader_uuid)))
        sleep(4)
    request.addfinalizer(fin)

    response = requests.post(url_with_path(FOLLOWER_URL, '/v1/connect'),
                             json={'socket_address': f"{LEADER_URL.host}:{LEADER_URL.port}"})

    assert requests.codes['ok'] == response.status_code


def test_get_followers_when_one_follower(_given_one_follower):
    response = requests.get(url_with_path(LEADER_URL, '/v1/clients'))

    assert requests.codes['ok'] == response.status_code

    response_json = response.json()

    assert "clients" in response_json
    assert isinstance(response_json['clients'], list)
    assert 1 == len(response_json['clients'])

    client = response_json['clients'][0]

    assert 'uuid' in client
    assert 'available' in client
    assert client['available'] is True
    assert 'status' in client
    assert 'lastUpdate' in client


def test_get_followers_no_clients():
    response = requests.get(url_with_path(LEADER_URL, '/v1/clients'))

    assert requests.codes['ok'] == response.status_code

    response_json = response.json()

    assert "clients" in response_json
    assert isinstance(response_json['clients'], list)
    assert 0 == len(response_json['clients'])


def _wait_for_performance_done(test_uuid: str, retries: int = 10, delay_secs: int = 2) -> dict:
    for _ in range(retries):
        performance_response = requests.get(url_with_path(LEADER_URL, '/v1/performance/{}'.format(test_uuid)))
        performance_response_json = performance_response.json()
        if performance_response_json['status'] == 'done':
            return performance_response_json
        sleep(delay_secs)
    raise Exception("Performance not done in time!")


def test_http_performance_test(_given_one_follower):
    data = """
    module.exports = {
    rps: 10,
    runtimeSeconds: 15,
    interface: 'http',
    method: 'get',
    url: 'http://localhost:9876/info'
    }"""
    response = requests.post(url_with_path(LEADER_URL, '/v1/performance'),
                             data=data,
                             headers={'Content-Type': 'application/javascript'})

    test_id = response.json()['test_uuid']

    performance_response_json = _wait_for_performance_done(test_id)

    assert "uuid" in performance_response_json
    assert test_id == performance_response_json['uuid']

    assert "metrics_config" in performance_response_json

    assert "status" in performance_response_json
    assert 'done' == performance_response_json['status']

    assert "followers" in performance_response_json

    assert "run_jobs" in performance_response_json

    assert "plan_jobs" in performance_response_json

    assert "result" in performance_response_json
    result = performance_response_json['result']
    assert "response_code" in result
    assert isinstance(result["response_code"], list)
    assert 150 == len(result["response_code"])
    assert "response_time" in result
    assert isinstance(result["response_time"], list)
    assert 150 == len(result["response_time"])

    assert "successful_requests" in result
    assert 150 == result["successful_requests"]

    assert "total_requests" in result
    assert 150 == result["total_requests"]

    assert "response_code_percentile_80" in result
    assert 0 < result["response_code_percentile_80"] < 200
    assert "response_code_percentile_95" in result
    assert 0 < result["response_code_percentile_95"] < 200
    assert "response_code_percentile_99" in result
    assert 0 < result["response_code_percentile_99"] < 200
