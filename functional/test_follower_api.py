import requests

from config_loader import FOLLOWER_URL
from url_utils import url_with_path


def test_connect_missing_socket_address():
    response = requests.post(url_with_path(FOLLOWER_URL, '/v1/connect'))

    assert requests.codes['bad'] == response.status_code
    response_json = response.json()

    assert 'errors' in response_json
    assert isinstance(response_json['errors'], list)
    assert 1 == len(response_json['errors'])
    first_error = response_json['errors'][0]

    assert 'paramName' in first_error
    assert 'socket_address' == first_error['paramName']
    assert 'reason' in first_error
    assert 'parameter missing' == first_error['reason']
