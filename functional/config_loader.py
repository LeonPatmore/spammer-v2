import os

from furl import furl

_leader_host = os.environ.get('LEADER_HOST', "52.31.91.233")
_leader_port = int(os.environ.get('LEADER_PORT', 5435))
_leader_scheme = os.environ.get('LEADER_SCHEME', "http")

_follower_scheme = os.environ.get('FOLLOWER_SCHEME', 'http')
_folllower_host = os.environ.get('FOLLOWER_HOST', "52.31.91.233")
_follower_port = int(os.environ.get('FOLLOWER_PORT', 1234))

if _leader_host is None:
    raise Exception("Env var `LEADER_HOST` must be set!")

if _folllower_host is None:
    raise Exception("Env var `FOLLOWER_HOST` must be set!")

LEADER_URL = furl(scheme=_leader_scheme, host=_leader_host, port=_leader_port)
FOLLOWER_URL = furl(scheme=_follower_scheme, host=_folllower_host, port=_follower_port)
