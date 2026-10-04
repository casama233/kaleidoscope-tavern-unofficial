# ChineseFood interaction recovery

Local compatibility releases from 1.0.18 give ChineseFood paired manifests a readable Chinese name before adding the explicit compatibility/author-version suffix. Previously that suffix was appended to `pack.name`, making it an unresolvable language key. Outputs for already frozen releases through 1.0.17 stay unchanged.

The accompanying private integration repair retires only six exact missing pickle inventory bindings proved absent in a stopped-world snapshot; unknown or merely unloaded inventory actors remain protected. Native bowl/pickle storage owns item drops, so the recovered components explicitly replace the legacy break callbacks instead of inheriting them through Object.assign. Existing refrigerator runtime and data remain unchanged. Private source, world data and author assets are not published here.

Bowl interactions were compared against the author's Java ChineseFood 1.1.14 release (CurseForge file 9024712): capacity three, empty-hand retrieval and a ten-tick cooldown for pulling from the container below. Full-family native startup/restart and a fresh stopped-save rehearsal remain deployment gates. Client interaction acceptance remains pending.
