# Public beta readiness — 0.6.33-beta.1

- English, Simplified Chinese and Traditional Chinese: matching 1,655-key language maps, no duplicate/empty keys or placeholder mismatches; 140 guide entries in 11 categories have names and instructions in all three languages.
- Board form labels use client-localized RawMessages. Generated English guide text no longer includes Chinese quality labels. Partial Japanese/Russian legacy files are retained without claiming complete support.
- Runtime board atlases are generated exclusively from GNU Unifont 15.0.06; the beta contains no Minecraft bitmap-provider font subset. Font input, license, provenance and generator are included.
- Public Cookery 1.0.6 dependencies and Tavern pack versions are checked. Both BP and RP, credits and notices are included in deterministic packaging.
- Static resource/script/reference checks and real BDS 1.26.51.1 startup with Cookery 1.0.6 are recorded in `VALIDATION-0.6.33.json`. No interaction simulations were run.
- Repository history credential-pattern and archive-name scans found no matching tokens/private keys or server-world files; release contents exclude local server backups, credentials, executables and private integration patches. Automated scanning is not a proof that every possible secret pattern is absent.

## Public-test scope

Android rendering and device-specific Vibrant Visuals behavior still require client feedback. BDS startup does not render assets. Realms and all-mobile compatibility are not claimed. Slightly Tipsy, Grass Stealth and Long Reach remain unavailable. See the Java visual audit and installation instructions for platform differences and dependency requirements.

Publishing this GitHub prerelease does not publish a CurseForge listing. The private FAMILY server integration is separate from this public package.
