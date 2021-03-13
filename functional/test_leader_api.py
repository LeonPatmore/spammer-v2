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
