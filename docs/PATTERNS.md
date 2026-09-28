# Pattern note

Counted from `catalog/hackmit/catalog.json` at `fff6c6c23928a649255258239219dfe8d1c41679`. Schema `0.1.0`. `datasetLabel` is `staged-observations`. The catalog `synthetic` flag is false. Every claim `reviewStatus` is `unreviewed`. This note does not accept a claim.

## Corpus

**Basis:** catalog project records. **What was counted:** `projects[].synthetic`.

2180 projects, all `synthetic: false`. 0 synthetic projects. Events (12), submissions (2180), repositories (921), evidence (2276), and claims (5969) are also all `synthetic: false`.

`startsAt` and `endsAt` are unknown on all 12 events. The recorded reasons are that no start time or end time was staged.

## Track labels that recur

**Basis:** source-reported. **What was counted:** project claims whose statement is `The gallery card names the track {label}.` Each of these projects has one such claim. The label is card text, not a product-domain fact.

920 of 2180 projects have one track-label claim. 1260 projects have none. Their track is unknown in this file.

| Label | Projects |
| --- | ---: |
| General | 192 |
| Education | 186 |
| Healthcare | 153 |
| Beginner | 141 |
| Sustainability | 96 |
| Entertainment | 89 |
| Interactive Media | 57 |
| NO TRACK | 6 |

`NO TRACK` is the literal label on 6 cards. It is not an empty field. Statements that say `names challenge preferences:` were not counted as track labels.

## Events with repository locators

**Basis:** repository locator fields, not a claim basis. **What was counted:** `repositories[].locator` with `status` `known`, grouped by `events[].name` through that project's one submission.

921 repository records, each with a known locator. 920 values start with `https://github.com/`. One value starts with `https://www.github.com/`. No locator status is unknown. 921 projects have one repository.

| Event name | Projects | With a known locator |
| --- | ---: | ---: |
| HackMIT 2025 | 319 | 300 |
| HackMIT 2026 | 299 | 284 |
| HackMIT | 284 | 0 |
| HackMIT 2024 | 219 | 205 |
| HackMIT 2019 | 211 | 7 |
| HackMIT 2017 | 176 | 19 |
| HackMIT 2018 | 176 | 0 |
| HackMIT 2023 | 173 | 0 |
| HackMIT 2016 | 156 | 17 |
| HackMIT'14 | 62 | 0 |
| Blueprint 2026 | 59 | 49 |
| Blueprint 2025 | 46 | 40 |

Events with at least one known locator: HackMIT 2025, HackMIT 2026, HackMIT 2024, Blueprint 2026, Blueprint 2025, HackMIT 2017, HackMIT 2016, HackMIT 2019. Events with none: HackMIT, HackMIT 2018, HackMIT 2023, HackMIT'14. Event names are the catalog `name` field.

## Projects with a code-observed dependency claim

**Basis:** code-observed. **What was counted:** claim statements that say `is code-observed as a library` or `is code-observed as a framework`, grouped by project subject. A statement that says `is code-observed as a language` is not a dependency claim. Eight other claims have basis `code-observed` and say `An inspected revision was staged for this repository.` They do not say `is code-observed as a`, so they are not counted here.

142 dependency claims (137 library, 5 framework) are on 8 projects, all `synthetic: false`. Seven language statements are on 5 of those same 8 projects. No other project has a statement that says `is code-observed as a`.

## One limitation

**Basis:** code-observed statement text, and the path on the cited code evidence. **What was counted:** the 149 statements that say `is code-observed as a`, including the 142 dependency claims.

Those statements record a name at one inspected revision, usually as a manifest path written in the statement. They do not record a mechanism. For all 149, the cited code evidence has `path.status` `unknown`, reason `No code path was staged for this revision.` The evidence record does not show that the named package is called.

## Checks

No tests were run. Counts are a Python read of this commit's `catalog/hackmit/catalog.json`. No catalog rows were edited.
