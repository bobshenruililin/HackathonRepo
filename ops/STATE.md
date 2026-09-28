# State

Catalog snapshot is this file. It adds code-observed dependency claims for Kami, Spidey Sense, and Eve onto the catalog from pull request #27. Pull request #28 did not change the catalog. M0 is not accepted. This file does not treat a security review as acceptance.

## WHAT YOU BUILT

Schema 0.1.0 separates events, projects, submissions, repositories, evidence, and claims. Ingest 0.1.0 replays staged observations without fetching. The canonical catalog is `catalog/hackmit/catalog.json`. The SQLite index, CLI, and explorer read that catalog and can be rebuilt. `hackmitTrackTaxonomy()` accepts five source-reported track labels on problem-domain: education, healthcare, sustainability, entertainment, and interactive-media. `createTaxonomyRegistry()` stays empty. The other dimensions have no accepted value. Catalog projects are not classified with these labels. Eval reports `NOT MEASURED` unless a real gold judgment, a real corpus, and retrieval ids are all supplied. Repository observations classify caller-supplied paths and do not fetch or execute. Analogue retrieval returns direct, mechanism, and demo matches that cite claims. The exact label `Beginner` is generic, as are `General` and `NO TRACK`. Original code is MIT. Ordinary public reads for this run are in `DATA_POLICY.md`. Devpost automation stays disabled.

The morning narrative is `docs/OVERNIGHT_REPORT.md`.

## WHAT DATA YOU FOUND

Public Devpost galleries, the Plume gallery API, and the Ballot gallery API. Blueprint 2025 and 2026 are a separate event family. Sixty-two Devpost winner pages named prizes on existing 2016 and 2017 projects. Eighteen archive "past project" pages were merged when the URL and title agreed. Unresolved repository name matches were not merged.

Missing lists, not empty editions: Devpost 2015 and 2020, Plume 2022–2024, Blueprint 2023–2024. The 2016 extract is 156 of a stated 157. LeanOnMe had no https page. Plume and Ballot project URLs are inferred. Those project pages were not fetched.

## HOW MANY REAL RECORDS EXIST

| | |
| --- | ---: |
| Real projects | 2180 |
| Synthetic projects | 0 |
| Submissions | 2180 |
| Repository locators | 921 |
| Evidence | 2276 |
| Claims | 5969 |
| Events | 12 |

Source-reported claims: 4870. Inferred claims: 942. Code-observed claims: 157. Test-observed claims: 0. Evidence kinds: source 2268, code 8. Eight projects have code-observed dependency claims: The Cambridge Sock Company, EcoAI, Mozaic, HeartFrame, Erbgut, Kami, Spidey Sense, and Eve. Projects with an award, prize, or winner claim: 218. Of those, 84 also have a repository locator. Projects with a demo-URL claim: 455. Exact titles that repeat: 30 titles, 66 project ids, not merged.

## WHICH YEARS/SOURCES ARE COVERED

HackMIT (2013 Devpost page) 284, HackMIT'14 62, 2016 156, 2017 176, 2018 176, 2019 211, 2023 173, Ballot 2024 219, Plume 2025 319, Plume 2026 299, Blueprint 2025 46, Blueprint 2026 59. Event start and end are unknown. The 2013 page is named HackMIT, not HackMIT 2013. The Plume "HackMIT 2026" name is the client-script name for that gallery only.

## WHAT WORKS

Ingest replay, schema validation, index build, CLI search, explorer search with event name, award, track, and repository filters, analogue retrieval over claim text, and the eval harness refusal to invent precision. The explorer was checked over HTTP against a generated index of the catalog before the last prize pages and before the code-observed claims. Pull request #25 accepts five source-reported track labels. Those values are not assigned on catalog projects. Pull request #28 ignores the exact label `Beginner` in direct analogues.

## WHAT WAS TESTED

`pnpm test` on Node 24.21.0 at the code-observed claims commit, before pull request #28, passed: schema 26, ingest 14, catalog-index 16, cli 14, eval 7, taxonomy 8, repo-observations 21, analogues 19. Pull request #28 added one analogue test. GitHub Actions passed on pull requests #27 and #28. This docs revision does not re-run the suite. Playwright was not re-run. Precision and recall were not measured.

## WHAT FAILED

`projects.hackmit.org` did not resolve. `expo.hackmit.org` failed TLS and was not retried with verification disabled. LeanOnMe's only known page was `http` and did not resolve. One 2016 gallery card of a stated 157 was not found and was not invented. Devpost automation was not run.

## WHAT IS UNCERTAIN

StudyDate and Text2Test repository strings differ from the gold pages by `.git` and, for StudyDate, letter case. Whether those strings are the same repository was not checked again. Two projects named Pilot were left as different projects. Plume and Ballot project pages were not opened. Eleven inspected repositories did not match a catalog locator and were not imported. `Preet37/money-maxing` does not match `https://github.com/athm23/money-maxing`. The analogue sample predates the `Beginner` filter and these code-observed claims. Direct mode still matches a shared sponsor-challenge string. Five track labels are accepted as problem-domain values and are not assigned on projects. The other dimensions have no accepted value. Removal intake is undefined. The second security pass does not accept M0.

## WHAT YOU WOULD DO NEXT

Re-run the analogue sample on this catalog. Do not treat a shared sponsor challenge as a problem-domain analogue without a new recorded decision. Assign the five accepted track labels only from gallery track claims. Do not accept music, finance, or sponsor-challenge mechanism labels without a new recorded decision. Do not score the six fixed queries until a gold set states the full relevant set. Do not treat a missing gallery as an empty edition.
