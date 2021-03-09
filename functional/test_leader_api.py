import requests

from config_loader import LEADER_URL
from url_utils import url_with_path


def test_get_followers_when_one_follower():
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
