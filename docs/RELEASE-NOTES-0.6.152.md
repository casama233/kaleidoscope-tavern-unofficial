# Tavern 0.6.152

Extension COMMIT previously scanned the complete joined payload twice for
UTF-8 length and its UTF-16 FNV checksum. The receiver now advances the checksum
through stored contiguous chunks during receipt. Each chunk event adds at most
two parts, or 2800 UTF-16 units, of checksum work. Exact duplicates are not
hashed twice. An unfinished out-of-order prefix retains the original complete
checksum fallback at COMMIT.

COMMIT derives joined UTF-8 length from accepted chunk byte totals and at most
512 nonempty boundary checks. A high/low surrogate pair across a boundary
reduces the summed byte count by two; empty chunks do not break that boundary.
Existing chunk admission, including its failed oversized-chunk counter side
effect, remains unchanged. Split-surrogate transfers retain their original
rejection behavior. Byte mismatch still precedes checksum, JSON, source and
registry validation errors.

Three focused integrity tests and four existing transport case bodies passed
against the current receiver, covering Unicode, duplicates, reverse order,
invalid checksum, missing/conflicting chunks, replacement, expiry and failed
admission. A source differential using the actual W128 payload and its 175
packets preserved ACKs, errors, full registry results and cleanup. For the same
input packets/revision, ordered COMMIT avoids both full integrity scans; reverse
receipt can still require the original checksum scan. The public SDK is a
producer and has no receiver implementation to change.

Registration and ACK remain synchronous. Packet/chunk UTF-8 checks, joining,
JSON parsing and Registry installation/rebuild remain; there is no asynchronous
staging, readiness/storage change or different gameplay timing. Source scan
counts do not establish native startup performance, and the observed watchdog
spikes remain unresolved until fresh native evidence supports a conclusion.
Human client acceptance remains pending.

The paired packs, build and guide identity advance to 0.6.152. That new release
identity produces its own payload digest; same-input transport equivalence does
not claim that different release payload versions have identical packets.
Frozen 0.6.151 content remains unchanged.
