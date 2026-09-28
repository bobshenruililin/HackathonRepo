# Overnight report

Catalog counts below are the file on `main` after pull request #27, merge `bc479ac5f04019071fc8043f9c6a538448160c10` (2026-09-28). Pull request #28, merge `abba5bc1211761834283d7edb9c724159fa5561e`, did not change that file. This is a record of what is in the repository now. It is not an acceptance of M0.

## What is in the repository

Hackathon Atlas keeps events, projects, submissions, repositories, evidence, and claims separate. The canonical HackMIT catalog is `catalog/hackmit/catalog.json` (schema 0.1.0). The SQLite FTS5 index is generated from that file and is not canonical.

Original code is MIT, Copyright (c) 2026 Shen Ruililin. Third-party material stays under its own terms. Ordinary public reads for this run are recorded in `DATA_POLICY.md`. Bulk collection is not approved. Devpost automation stays disabled.

Local tools on `main`: ingest, catalog index, CLI search, Next.js explorer, taxonomy registry, retrieval eval harness, read-only repository observations, and deterministic analogue retrieval (`direct`, `mechanism`, `demo`). Analogue hits cite claim text. Generic overlap is not a match. That includes a YouTube host and the exact track or challenge label `Beginner`.

## Corpus

The catalog was ingested from public gallery cards fetched on 2026-09-28, plus Devpost project pages that matched an existing card by URL and title.

| | |
| --- | ---: |
| Projects | 2180 |
| Synthetic projects | 0 |
| Submissions | 2180 |
| Repository locators | 921 |
| Evidence | 2270 |
| Claims | 5904 |
| Events | 12 |

Claim basis in the file: source-reported 4870, inferred 942, code-observed 92, test-observed 0. Evidence kinds: source 2265, code 5. Review status is unreviewed. The catalog text contains no `@`.

| Event | Projects | Known repository |
| --- | ---: | ---: |
| HackMIT (2013 Devpost page; the page is not titled HackMIT 2013) | 284 | 0 |
| HackMIT'14 | 62 | 0 |
| HackMIT 2016 | 156 | 17 |
| HackMIT 2017 | 176 | 19 |
| HackMIT 2018 | 176 | 0 |
| HackMIT 2019 | 211 | 7 |
| HackMIT 2023 | 173 | 0 |
| HackMIT 2024 (Ballot) | 219 | 205 |
| HackMIT 2025 (Plume) | 319 | 300 |
| HackMIT 2026 (Plume client-script name) | 299 | 284 |
| Blueprint 2025 | 46 | 40 |
| Blueprint 2026 | 59 | 49 |

Blueprint is a separate event family. Start and end times are unknown. Sixty-two Devpost pages for 2016 and 2017 cards labeled only "Winner" were merged onto those projects and named the prize. They did not add projects. Thirty-six of those pages also linked a repository.

218 projects have an award, prize, or winner claim. 84 of those also have a repository locator. 455 projects have a demo-URL claim. 30 exact titles repeat across 66 project ids. Those ids were not merged.

Five repositories whose locators already matched a catalog project have code-observed dependency claims from public manifest names at a pinned commit: The Cambridge Sock Company, EcoAI, Mozaic, HeartFrame, and Erbgut. That is 87 technology claims on those projects, plus five repository claims that an inspected revision was staged. Scoped npm package names are written without a leading at-sign. Code-evidence paths stay unknown; each technology statement names one manifest or file path. Eleven other inspected repositories were not attached, because the normalized locator was not already in the catalog. Awards were not inferred from those repositories.

## What the sources did not support

These are missing lists, not findings that the edition had zero projects:

- Devpost 2015 returned no matching submissions. That year's rules say Devpost was not used.
- Devpost 2020 was unpublished.
- Plume indexes for 2022, 2023, and 2024 returned no project list.
- Blueprint 2023 and 2024 returned no project list.
- The Plume client script that was read does not name `hack-2021`, so that URL was not requested.
- The 2016 gallery states 157 projects. The extract has 156. The missing card was not invented.
- LeanOnMe had only an `http` page and a DNS failure. It is not in the catalog.
- `projects.hackmit.org` did not resolve. `expo.hackmit.org` failed TLS. Those failures were not retried by disabling verification.
- Plume and Ballot project page URLs were inferred from the gallery link template. Those project pages were not fetched.

## Evaluation

Precision and recall are **NOT MEASURED**. The gold set is six rechecked Devpost pages. All six match one catalog project each on title, event name, and the project-page award quote. Pilot and Rap Scorer repository URLs agree. Breast Cancer Detection and Verifast have no repository on either side. StudyDate and Text2Test differ as exact strings: the catalog drops a trailing `.git`, and StudyDate also differs in letter case. A second project named Pilot is HackMIT 2026 and is not the gold page. The six pages are not a complete relevance judgment for the six fixed queries, so the eval harness correctly stays `NOT MEASURED`.

The filter "award claim and a known repository" returns 84 projects. That is a filter count, not precision or recall.

Keyword scans for computer vision, physical-world-plus-AI, speech, and social matching were not treated as answers. Sponsor-challenge wording and unrelated titles match those words. Those four queries, and "README claims supported by repository evidence," stay **NOT MEASURED**. Five projects now have code-observed dependency claims. That is not a measurement of the last query.

## Taxonomy and patterns

`hackmitTrackTaxonomy()` accepts five source-reported track labels as problem-domain values: education, healthcare, sustainability, entertainment, and interactive-media. That seed is on `main` via pull request #25 (merge `5fb241dfbed1a5cfa00ec64af930c80a772cc87b`). `createTaxonomyRegistry()` stays empty. These values are the gallery's track labels, not inferred product domains. Prize titles, sponsor challenges, and demo hosts were not accepted. General, Beginner, and NO TRACK were not accepted. The other eleven dimensions have no accepted value. Catalog projects are not individually classified.

A pattern note counted an earlier file (2,180 projects, before the last 22 prize pages and before the code-observed claims). Award and repository totals in that note are stale. The table above is the current file. No pattern statement treats a prize as a cause.

## Analogue sample

`retrieveAnalogues` was run on the catalog at `8f1914d`, before the code-observed claims and before `Beginner` was ignored. The run used Node v22.22.2 because Node 24.21.0 was absent on that machine. Package tests on an in-memory fixture passed (19). The sample is not a recommendation and is not precision or recall.

- 2-Player Hot Potato, Blueprint 2025: direct matched 140 real projects on the label `Beginner`. Mechanism and demo were unknown. Pull request #28 now treats that exact label as generic. The sample was not re-run after that change.
- Window Share, HackMIT 2016, and TravelAR, HackMIT 2017: direct and mechanism unknown. Demo was `no-match` because the host is `youtube.com`.
- Wirehead, HackMIT 2025, one project whose gallery track claim says Education: direct matched 330 real projects. 185 of those share `Education`. The union also includes shared sponsor-challenge text. Mechanism was unknown. Demo was `no-match` (`youtube.com`).

Direct mode still treats a shared sponsor-challenge string as a match. Interaction analogues and distant structural analogues are not implemented. The sample was not repeated on the catalog that contains the five code-observed repositories.

## Tests

`pnpm test` on Node 24.21.0 at the code-observed claims commit, before pull request #28: schema 26, ingest 14, catalog-index 16, cli 14, eval 7, taxonomy 8, repo-observations 21, analogues 19. All passed. Pull request #28 added one analogue test. GitHub Actions "Install, typecheck, and test" passed on pull requests #27 and #28. This docs revision does not re-run the suite.

Explorer checks before the filter pull request merged: the generated index served event names, paged results ("Showing 1–40 of 2180"), award plus a known repository (69 on the earlier catalog; the catalog now has more prize pages), Window Share, and 2-Player Hot Potato on track Beginner. Playwright was not re-run at this commit.

## Still open

- Eve (`KieranCSchmitt/Eve`) and money-maxing (`Preet37/money-maxing`) were opened read-only and do not match a catalog repository locator. They were not added as projects.
- kami and spideysense match catalog locators. Their code-observed rows are not in the catalog yet.
- Eleven other inspected repositories stay unresolved. No project was created for them.
- The analogue sample was not re-run after `Beginner` became generic, and it was not re-run after the five code-observed repositories landed.
- Direct mode still matches a shared sponsor-challenge string. Interaction analogues and distant structural analogues are not built.
- Removal intake is still undefined.
- The second security pass is done and does not accept M0.
