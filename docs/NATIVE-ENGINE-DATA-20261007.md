# Native engine data inputs

BDS1.26.51.1 loads profiler/bootstrap inputs from its genuine `data` directory. The isolated engine must pin that entire tree and copy it as ordinary independent files; changing or omitting a copied file, or changing the input during the copy, rejects setup before launch. No bootstrap JSON is synthesized and no startup error is filtered.

Distributions without a data directory retain their actual prior engine inventory and receive no synthesized data directory. This tool-only change preserves all exported runtime bytes, pack identities, the private deployment hold, current server configuration and the live world. Static filesystem fixtures are separate from subsequent native BDS and client acceptance.

The native and fresh stopped-world callers supply their captured engine inventory to setup. Data presence and every file hash must match that capture before an isolated directory is created, preventing a temporary input change from being copied and then restored before the later validation check.
