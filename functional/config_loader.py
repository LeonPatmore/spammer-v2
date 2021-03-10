import os

from furl import furl

_leader_host = os.environ.get('LEADER_HOST', "54.90.229.5")
_leader_port = int(os.environ.get('LEADER_PORT', 5435))
_leader_scheme = os.environ.get('LEADER_SCHEME', "http")

_follower_scheme = os.environ.get('FOLLOWER_SCHEME', 'http')
_folllower_host = os.environ.get('FOLLOWER_HOST', '54.90.229.5')
_follower_port = int(os.environ.get('FOLLOWER_PORT', 1234))

LEADER_URL = furl(scheme=_leader_scheme, host=_leader_host, port=_leader_port)
FOLLOWER_URL = furl(scheme=_follower_scheme, host=_folllower_host, port=_follower_port)
