from furl import furl


def url_with_path(url: furl, path: str) -> str:
    url = url.copy()
    url.path.add(path)
    return url.tostr()
