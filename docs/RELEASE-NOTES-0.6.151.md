# Tavern 0.6.151

The main startup recipe scan and extension registry repeatedly queried the same
native item definitions. They now share successful lookup results for that
registry boot. Native definitions are fixed for the loaded packs during a boot;
unknown results are not cached, and lookup errors propagate unchanged and can
be retried. The wrapper applies only to the native reader selected in `main`.
Generic registry predicates and the existing native tag cache are unchanged.

For identical inputs, the cache change preserves synchronous registration,
recipe validation, guide content, packet bytes, revisions, ACKs, listener order,
gameplay timing and saved state. The release identity advances separately to
0.6.151. It does not add asynchronous COMMIT staging or change storage readiness.
Initial registry construction and rebuild still run synchronously, so this
repair does not establish that the observed startup spike is resolved.

Three focused source tests passed: successful reads are reused while missing
items can later appear; lookup errors retain their identity without poisoning
later reads; generic predicates retain dynamic calls. The existing release CI
runs these tests. A targeted differential using the actual source modules also
preserved registry and guide results, transport packets, rejection errors,
replacement, dynamic tags and unregister behavior. Private source fixtures and
their diagnostic report remain outside this public repository.

These checks measure source callback counts and functional equivalence, not
Bedrock engine time. Native startup and human client acceptance remain pending.
The paired pack, build and guide release identities advance to 0.6.151; frozen
0.6.150 content remains unchanged.
