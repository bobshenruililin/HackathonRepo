# Overnight report

Catalog counts below are the file on `main` at `8f1914de1bcebe30075736a49cd6fb5af796ed01` (2026-09-28). Pull request #25, merge `5fb241dfbed1a5cfa00ec64af930c80a772cc87b`, did not change that file. This is a record of what is in the repository now. It is not an acceptance of M0.

## What is in the repository

Hackathon Atlas keeps events, projects, submissions, repositories, evidence, and claims separate. The canonical HackMIT catalog is `catalog/hackmit/catalog.json` (schema 0.1.0). The SQLite FTS5 index is generated from that file and is not canonical.

Original code is MIT, Copyright (c) 2026 Shen Ruililin. Third-party material stays under its own terms. Ordinary public reads for this run are recorded in `DATA_POLICY.md`. Bulk collection is not approved. Devpost automation stays disabled.

Local tools on `main`: ingest, catalog index, CLI search, Next.js explorer, taxonomy registry, retrieval eval harness, read-only repository observations, and deterministic analogue retrieval (`direct`, `mechanism`, `demo`). Analogue hits cite claim text. Generic overlap, including a YouTube host, is not a match.

## Corpus

The catalog was ingested from public gallery cards fetched on 2026-09-28, plus Devpost project pages that matched an existing card by URL and title.

| | |
| --- | ---: |
| Projects | 2180 |
| Synthetic projects | 0 |
| Submissions | 2180 |
| Repository locators | 921 |
| Evidence | 2260 |
| Claims | 5812 |
| Events | 12 |

Claim basis in the file: source-reported 4870, inferred 942, code-observed 0, test-observed 0. Every evidence record is kind `source`. Review status is unreviewed. The catalog text contains no `@`.

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

Keyword scans for computer vision, physical-world-plus-AI, speech, and social matching were not treated as answers. Sponsor-challenge wording and unrelated titles match those words. Those four queries, and "README claims supported by repository evidence," stay **NOT MEASURED**. The catalog has no code-observed claim yet, so the last query cannot be answered from the catalog.

## Taxonomy and patterns

`hackmitTrackTaxonomy()` accepts five source-reported track labels as problem-domain values: education, healthcare, sustainability, entertainment, and interactive-media. That seed is on `main` via pull request #25 (merge `5fb241dfbed1a5cfa00ec64af930c80a772cc87b`). `createTaxonomyRegistry()` stays empty. These values are the gallery's track labels, not inferred product domains. Prize titles, sponsor challenges, and demo hosts were not accepted. General, Beginner, and NO TRACK were not accepted. The other eleven dimensions have no accepted value. Catalog projects are not individually classified.

A pattern note counted this catalog's predecessor (2,180 projects, before the last 22 prize pages). Award and repository totals in that note are stale by those 22 pages. The table above is the current file. No pattern statement treats a prize as a cause.

## Tests

`pnpm test` on Node 24.21.0 at `8f1914d`, before the taxonomy merge: schema 26, ingest 14, catalog-index 15, cli 14, eval 7, taxonomy 7, repo-observations 21, analogues 19. All passed. Pull request #25 added one taxonomy test. GitHub Actions on `6f7c776` passed. This docs revision does not re-run the suite. GitHub Actions "Install, typecheck, and test" passed on the merged pull requests through #25.

Explorer checks before the filter pull request merged: the generated index served event names, paged results ("Showing 1–40 of 2180"), award plus a known repository (69 on the earlier catalog; the catalog now has more prize pages), Window Share, and 2-Player Hot Potato on track Beginner. Playwright was not re-run at this commit.

## Still open

- Code-observed technology rows from the repository samples are not in the catalog. A mapping onto repositories that are already linked is in progress.
- Four participant repositories named Eve, money-maxing, kami, and spideysense were still unopened.
- Analogue retrieval has not yet been saved as a sample over the real catalog.
- Removal intake is still undefined.
- The second security pass is done and does not accept M0.
