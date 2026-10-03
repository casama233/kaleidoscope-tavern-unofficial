"""Verify the exact readable Java pin and active client adapter, without a game."""
import argparse, hashlib, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--java-source', type=Path, required=True)
args = parser.parse_args()
ref = json.loads((ROOT / 'data/tipsy-source-reference.json').read_text())
head = subprocess.check_output(['git', '-C', str(args.java_source), 'rev-parse', 'HEAD'], text=True).strip()
assert head == ref['commit'], ('Incorrect Java pin', head)
for name, expected in ref['files'].items():
    raw = (args.java_source / name).read_bytes().replace(b'\r\n', b'\n')
    assert hashlib.sha256(raw).hexdigest() == expected['sha256'], name
    assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == expected['git_blob_sha1'], name

camera = (args.java_source / next(name for name in ref['files'] if name.endswith('CameraAnglesEvent.java'))).read_text()
assert 'player.tickCount + event.getPartialTick()' in camera
assert 'Math.sin(t / 19.0) * 0.6' in camera and 'Math.cos(t / 13.0) * 0.3' in camera and 'Math.sin(t / 9.0) * 0.1' in camera
assert 'event.setRoll(event.getRoll() + (float) value)' in camera
assert 'getAmplifier' not in camera
base = (args.java_source / next(name for name in ref['files'] if name.endswith('BaseEffect.java'))).read_text()
assert 'return false;' in base and 'addAttributeModifier' not in base
adapter = (ROOT / 'runtime/BP/scripts/bedrock/tipsy-visual.js').read_text()
for forbidden in ('.setRotation(', '.getRotation(', '.setCamera(', '.stopShaking(', 'camerashake stop', '.addEffect(', '.applyImpulse('):
    assert forbidden not in adapter, forbidden
subprocess.run(['node', 'tools/check_visual_rules.mjs'], cwd=ROOT, check=True)
subprocess.run(['node', '--loader', './tools/efficiency/mock-loader.mjs', '--test', 'tools/tipsy-client.test.mjs'], cwd=ROOT, check=True)
print(json.dumps({'javaCommit': head, 'sourceFilesVerified': len(ref['files']), 'sourceChecks': 'passed', 'exactJavaRoll': False, 'clientTested': False, 'bdsTested': False}))
