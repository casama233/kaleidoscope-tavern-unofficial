#!/usr/bin/env python3
"""Plan CI from the full Git diff; unrecognised inputs require all checks."""
import argparse
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess


# These tools are covered by the unconditional baseline/family test job.
FAMILY_TOOLS = {
    f"tools/{name}.py"
    for name in (
        "family_bundle", "family_guard", "family_native_check", "family_saved_world",
        "family_upstream_watch", "family_java_upstream_watch", "test_family_java_upstream_watch", "family_update", "test_family_bundle", "test_family_guard",
        "test_family_saved_world", "test_family_upstream_watch",
    )
}
FAMILY_DATA = {"family/upstream.lock.json", "family/upstream-feedback.json", "family/java-upstream.json"}
ROOT_DOCS = {"AGENTS.md", "README.md", "README.zh-TW.md", "CONTRIBUTING.md"}


def classify_path(name):
    """Only explicit, non-runtime inputs may use the inexpensive path."""
    path = PurePosixPath(name)
    if not name or path.is_absolute() or ".." in path.parts:
        return "runtime"
    if name in FAMILY_TOOLS or name in FAMILY_DATA or name.startswith("tools/family_update/"):
        return "family"
    # Markdown inside test/fixture trees and packaged release notes are inputs,
    # not prose-only changes. Unknown files (including new configs) fail closed.
    if name in ROOT_DOCS:
        return "docs"
    if path.suffix == ".md" and not any(p in {"tests", "fixtures", "data", "sdk", "art"} for p in path.parts):
        if path.parent == PurePosixPath("family"):
            return "docs"
        if name.startswith("docs/") and not path.name.startswith("RELEASE-NOTES-"):
            return "docs"
    return "runtime"


def plan(paths, force_full_reason=None):
    groups = {"docs": [], "family": [], "runtime": []}
    for name in sorted(set(paths)):
        groups[classify_path(name)].append(name)
    return {
        "schema": 1,
        "baseline": True,
        "runtime": bool(force_full_reason or groups["runtime"]),
        "family": bool(groups["family"]),
        "reason": force_full_reason or (
            "Runtime, validation, source or unknown input changed" if groups["runtime"]
            else "Only explicitly covered family inputs or prose changed"
        ),
        "paths": groups,
    }


def changed_paths(event_name, event, repo):
    if event_name == "workflow_dispatch":
        return [], "Manual runs always execute the complete validation suite"
    try:
        if event_name == "pull_request":
            base = event["pull_request"]["base"]["sha"]
            head = event["pull_request"]["head"]["sha"]
            separator = "..."
        elif event_name == "push":
            base, head = event["before"], event["after"]
            separator = ".."
        else:
            return [], "Unknown event requires complete validation"
        if not all(isinstance(sha, str) and re.fullmatch(r"[0-9a-fA-F]{40}", sha) and set(sha) != {"0"} for sha in (base, head)):
            return [], "Missing or invalid comparison revision requires complete validation"
        # No rename detection: both the removed and added path participate. A
        # runtime file renamed into docs must never become a docs-only change.
        result = subprocess.run(
            ["git", "diff", "--no-renames", "--name-only", "-z", f"{base}{separator}{head}", "--"],
            cwd=repo, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        return [name for name in result.stdout.decode("utf-8").split("\0") if name], None
    except (KeyError, TypeError, OSError, UnicodeError, subprocess.CalledProcessError):
        return [], "Unavailable comparison history requires complete validation"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--paths", nargs="*", help="Explicit changed paths for local planning")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    if args.paths is not None:
        paths, reason = args.paths, None
    else:
        try:
            event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
            paths, reason = changed_paths(os.environ.get("GITHUB_EVENT_NAME"), event, args.repo)
        except (KeyError, OSError, ValueError):
            paths, reason = [], "Unavailable event payload requires complete validation"
    result = plan(paths, reason)
    print(json.dumps(result, indent=2))
    if output := os.environ.get("GITHUB_OUTPUT"):
        with open(output, "a") as stream:
            for key in ("baseline", "runtime", "family"):
                stream.write(f"{key}={str(result[key]).lower()}\n")
    if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(summary, "a") as stream:
            stream.write(f"CI impact: {result['reason']}.\n\n")
            stream.write("Baseline and family regressions always run. ")
            stream.write("All runtime jobs run.\n" if result["runtime"] else "Runtime jobs are explicitly skipped.\n")
            stream.write("\n```json\n" + json.dumps(result, indent=2) + "\n```\n")


if __name__ == "__main__":
    main()
