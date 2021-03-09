import os

from furl import furl

_leader_host = os.environ.get('LEADER_HOST', "54.210.124.130")
_leader_port = int(os.environ.get('LEADER_PORT', 5435))
_leader_scheme = os.environ.get('LEADER_SCHEME', "http")

LEADER_URL = furl(scheme=_leader_scheme, host=_leader_host, port=_leader_port)
