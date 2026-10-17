"""Fresh GitHub GET reads with bounded retries for explicit transport failures."""
import json
import re
import subprocess
import sys
import time


def transient(stderr):
    text = stderr.decode('utf-8', errors='replace').lower()
    # Authentication, authorization and absent resources never become retries,
    # even if a diagnostic happens to mention a transport error as well.
    if re.search(r'\bhttp(?:/[12](?:\.\d)?)?[\s:]+(?:401|403|404)\b', text):
        return False
    if any(value in text for value in ['bad credentials', 'authentication failed',
                                      'requires authentication', 'gh auth login']):
        return False
    return ('tls handshake timeout' in text or 'connection reset by peer' in text
            or bool(re.search(r'\bhttp(?:/[12](?:\.\d)?)?[\s:]+(?:502|503|504)\b', text)))


def emit_stderr(raw):
    if not raw:
        return
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr.buffer.write(raw)
    else:
        sys.stderr.write(raw.decode('utf-8', errors='replace'))
    sys.stderr.flush()


def api_bytes(endpoint):
    """Return the original response bytes; do not cache or validate its content."""
    assert isinstance(endpoint, str) and endpoint and not endpoint.startswith('-')
    command = ['gh', 'api', '--method', 'GET', endpoint]
    for attempt in range(3):
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        emit_stderr(result.stderr)
        if result.returncode == 0:
            return result.stdout
        if attempt == 2 or not transient(result.stderr):
            raise subprocess.CalledProcessError(result.returncode, command, output=result.stdout, stderr=result.stderr)
        time.sleep((.5, 1)[attempt])


def api_json(endpoint):
    # Parse after the transport loop: invalid JSON/schema/identity is not a
    # temporary GET failure and cannot trigger a second source read.
    return json.loads(api_bytes(endpoint))
