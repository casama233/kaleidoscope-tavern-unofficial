# Tavern history bootstrap

This branch is an import/recovery mechanism for the complete `Kaleidoscope Tavern Unofficial` development history.

The workflow reconstructs **A17, C1, C2, C3, C4, C5, C6, C7** from:

- the pinned public upstream source commit `6b0d619145316492f055e03d70427107cd73efa8`,
- the official CurseForge Tavern 1.2.0 NeoForge/1.21.1 JAR (file 8350856), verified by SHA-256,
- the small source/build/test deltas stored in `_bootstrap/bootstrap.tar.xz`.

It creates a temporary `tavern-history-import` branch and tags `a17`, `c1` … `c7`. It does **not** commit the Java JAR, `.class` files, fonts, or the Cookery binary dependency. `main` is moved separately only after the generated branch is verified.

Original art retains CC BY-NC-SA 4.0 terms and attribution; code/source terms remain as recorded by each stage.