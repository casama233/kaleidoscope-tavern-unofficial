#!/usr/bin/env python3
"""Prepare, resume and deploy one immutable full-family candidate.

The default is a read-only plan. --execute is required for every state change.
Local configuration provides paths and an existing BSM API adapter; credentials
and machine paths do not belong in the public repository.
"""
import argparse
import json
from pathlib import Path
import sys

# The sibling package and this entry script intentionally share the public
# command name; normal package import resolves its __init__.py first.
from family_update import common


def main(argv=None):
    if not __debug__:
        raise RuntimeError('Release safeguards require Python assertions; do not use -O/PYTHONOPTIMIZE')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('command', nargs='?', default='plan', choices=['plan', 'status', 'prepare', 'record-ci', 'deploy', 'update', 'saved-world', 'verify-live', 'cleanup-copies'])
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args(argv)
    common.configure(args.config)
    if args.command == 'cleanup-copies':
        if args.execute:
            common.verify_canonical_runner()
        from family_update import cleanup_copies
        result = cleanup_copies.main(['--execute'] if args.execute else [])
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    from family_update import workflow
    if not args.execute or args.command in ['plan', 'status']:
        print(json.dumps(workflow.plan(), ensure_ascii=False, indent=2))
        return 0
    common.verify_canonical_runner()
    if args.command == 'prepare':
        result = workflow.prepare()
    elif args.command == 'record-ci':
        result = workflow.record_static()
    elif args.command == 'deploy':
        result = workflow.deploy()
    elif args.command == 'update':
        if (common.R / 'deployment-result.json').exists():
            result = workflow.verify_deployed()
        else:
            result = workflow.prepare()
            if result['state'] != 'no_runtime_changes':
                result = workflow.deploy()
    else:
        # These internal stages are lease-bound and are called only from the
        # stopped deployment process; standalone invocation cannot skip it.
        common.assert_lease()
        workflow.run_stage({'saved-world': 'rehearse_saved_world', 'verify-live': 'poststart_verify'}[args.command])
        result = {'stage': args.command, 'ok': True, 'client': False}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (AssertionError, RuntimeError, ValueError) as error:
        print('FAMILY UPDATE: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
