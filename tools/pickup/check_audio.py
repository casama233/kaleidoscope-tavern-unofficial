#!/usr/bin/env python3
"""Verify shipped pickup samples against the pinned Mojang 1.20.1 asset hashes."""
import hashlib,json,pathlib
root=pathlib.Path(__file__).resolve().parents[2]
ref=json.loads((root/'data/pickup-java-audio-reference.json').read_text())
assert ref['version']=='1.20.1'
defs=json.loads((root/'runtime/RP/sounds/sound_definitions.json').read_text())['sound_definitions']
for path,row in ref['assets'].items():
 raw=(root/'runtime/RP'/path).read_bytes()
 assert hashlib.sha1(raw).hexdigest()==row['sha1'],path
 assert hashlib.sha256(raw).hexdigest()==row['sha256'],path
for event in ref['events']:
 alias=defs['kt_pickup.'+event]
 for sound in alias['sounds']:assert sound['name']+'.ogg' in ref['assets']
print(json.dumps({'pickupEvents':len(ref['events']),'verifiedAudioFiles':len(ref['assets']),'clientPlaybackTested':False}))
