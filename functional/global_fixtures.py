import pytest
import requests

from config_loader import LEADER_URL
from url_utils import url_with_path


@pytest.fixture
def leader_uuid():
    response = requests.get(url_with_path(LEADER_URL, 'v1/info'))

    assert requests.codes['ok'] == response.status_code

    return response.json()['uuid']
