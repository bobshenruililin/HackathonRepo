# Overnight report

Catalog counts below are `catalog/hackmit/catalog.json`. This note was read from `origin/main` at `4aeee36826fe8608eabcf54206243419758e9a68`. Pull request #44 attached unreviewed code-observed claims for GreenPlanner, Unwrap, and Prophecy. The earlier catalog change `b16f00e2a8336244b07363250364e04fc2f7046a` added code-observed dependency claims for Kami, Spidey Sense, and Eve onto the catalog from pull request #27. Pull request #28 did not change the catalog. This is a record of what is in the repository now. It is not an acceptance of M0.

## What is in the repository

Hackathon Atlas keeps events, projects, submissions, repositories, evidence, and claims separate. The canonical HackMIT catalog is `catalog/hackmit/catalog.json` (schema 0.1.0). The SQLite FTS5 index is generated from that file and is not canonical.

Original code is MIT, Copyright (c) 2026 Shen Ruililin. Third-party material stays under its own terms. Ordinary public reads for this run are recorded in `DATA_POLICY.md`. Bulk collection is not approved. Devpost automation stays disabled.

Local tools on `main`: ingest, catalog index, CLI search, `hackathon-atlas analogues`, Next.js explorer, taxonomy registry, retrieval eval harness, read-only repository observations, and deterministic analogue retrieval (`direct`, `mechanism`, `demo`). Analogue hits cite claim text. Generic overlap is not a match. That includes a YouTube host and the exact track or challenge label `Beginner`.

## Corpus

The catalog was ingested from public gallery cards fetched on 2026-09-28, plus Devpost project pages that matched an existing card by URL and title.

| | |
| --- | ---: |
| Projects | 2180 |
| Synthetic projects | 0 |
| Submissions | 2180 |
| Repository locators | 921 |
| Evidence | 2279 |
| Claims | 6002 |
| Events | 12 |

Claim basis in the file: source-reported 4870, inferred 942, code-observed 190, test-observed 0. Evidence kinds: source 2268, code 11. Review status is unreviewed. The catalog text contains no `@`.

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

218 projects have an award, prize, or winner claim. 84 of those also have a repository locator. 455 projects have a demo-URL claim. 30 exact titles repeat across 66 project ids. `docs/DUPLICATE_TITLES.md` (pull request #39) compared known locators on those names: 0 names share one identical known locator, 11 have two or more different known locators, and 19 are unknown because at least one project has no repository. Projects were not merged.

Eleven projects whose locators already matched a catalog project have code-observed dependency claims from public manifest names at a pinned commit: The Cambridge Sock Company, EcoAI, Mozaic, HeartFrame, Erbgut, Kami, Spidey Sense, Eve, GreenPlanner, Unwrap, and Prophecy. Technology claims of the form `is code-observed as a` number 179, on those 11 projects. Each of those projects also has one claim that an inspected revision was staged. GreenPlanner has 14 technology claims, Unwrap 15, and Prophecy 1 (`Python`). CampusMap still has no technology claims. Review status stays unreviewed. Code-evidence paths stay unknown. This is not an award inference and not evidence the package is called. Scoped npm package names are written without a leading at-sign. Each technology statement names one manifest or file path. Eleven other inspected repositories were not attached, because the normalized locator was not already in the catalog. `Preet37/money-maxing` was opened and was not attached. The catalog locator `https://github.com/athm23/money-maxing` belongs to a project named Money Maxer and is a different owner. Awards were not inferred from these repositories.

Staging file `catalog/hackmit/staged/code-observed-slice-2.json` is on main (pull request #37). It is not the catalog. CampusMap's commit was pinned and no root manifest was present. GreenPlanner, Unwrap, and Prophecy have observation reports there. Pull request #44 (merge `4aeee36826fe8608eabcf54206243419758e9a68`) attached those three projects' unreviewed code-observed claims to `catalog/hackmit/catalog.json`: 14 technology claims for GreenPlanner, 15 for Unwrap, and 1 for Prophecy (`Python`), plus one inspected-revision claim each. CampusMap still has no technology claims. Code evidence records: 11. Code-evidence paths stay unknown. This is not an award inference and not evidence the package is called.

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

Precision and recall are **NOT MEASURED**. The gold set is six rechecked Devpost pages. All six match one catalog project each on title, event name, and the project-page award quote. Pilot and Rap Scorer repository URLs agree. Breast Cancer Detection and Verifast have no repository on either side. StudyDate and Text2Test differ as exact strings: the catalog drops a trailing `.git`, and StudyDate also differs in letter case. `docs/LOCATOR_CHECK.md` (pull request #36) compared those links after dropping one trailing `.git` and ignoring case. StudyDate's page link and `https://github.com/bohanjiangg/studydate` are the same GitHub repository id `208467031`. Text2Test's `https://github.com/juliustao/text2test-aws.git` matches the catalog locator. `https://github.com/nampham148/text2test-server` is a different repository and was not added. Catalog locators were not changed. A second project named Pilot is HackMIT 2026 and is not the gold page. The six pages are not a complete relevance judgment for the six fixed queries, so the eval harness correctly stays `NOT MEASURED`.

The filter "award claim and a known repository" returns 84 projects. That is a filter count, not precision or recall.

Keyword scans for computer vision, physical-world-plus-AI, speech, and social matching were not treated as answers. Sponsor-challenge wording and unrelated titles match those words. Those four queries, and "README claims supported by repository evidence," stay **NOT MEASURED**. Eleven projects now have code-observed dependency claims. That is not a measurement of the last query.

## Taxonomy and patterns

`hackmitTrackTaxonomy()` accepts five source-reported track labels as problem-domain values: education, healthcare, sustainability, entertainment, and interactive-media. That seed is on `main` via pull request #25 (merge `5fb241dfbed1a5cfa00ec64af930c80a772cc87b`). `createTaxonomyRegistry()` stays empty. These values are the gallery's track labels, not inferred product domains. Prize titles, sponsor challenges, and demo hosts were not accepted. General, Beginner, and NO TRACK were not accepted. The other eleven dimensions have no accepted value. Catalog projects are not individually classified. The five labels are not stored on projects.

The explorer project page shows a derived Gallery track from `assignHackmitTrackFromClaims` (pull request #41, merge `88d1f6cf02a6e873e0db2bc6588cd576fea3b181`). Values are education, healthcare, sustainability, entertainment, or interactive-media for an exact gallery sentence. Otherwise the page shows Unknown with the reason `No exact gallery sentence for Education, Healthcare, Sustainability, Entertainment, or Interactive Media.` Beginner stays unknown. The assignment is not written into the catalog.

A pattern note counted an earlier file (2,180 projects, before the last 22 prize pages and before the code-observed claims). Award and repository totals in that note are stale. The table above is the current file. No pattern statement treats a prize as a cause.

## Analogue sample

The first run used the catalog at `8f1914d`, before the code-observed claims and before `Beginner` was ignored. It used Node v22.22.2. Package tests on an in-memory fixture passed (19). 2-Player Hot Potato matched 140 real projects on `Beginner`.

A second run used the catalog at `52077869607b4ddb12767d69704581b1c2f5240e`, after `Beginner` was generic and after the first five code-observed repositories, and before Kami, Spidey Sense, and Eve were attached. Node v24.21.0. Package tests on the in-memory fixture passed (20). The sample is not a recommendation and is not precision or recall.

- 2-Player Hot Potato: direct `no-match` because `Beginner` is generic. Mechanism and demo unknown.
- Window Share and TravelAR: direct and mechanism unknown. Demo `no-match` because the host is `youtube.com`.
- Wirehead: direct matched 330 real projects. 185 share `Education`. The union also includes shared sponsor-challenge text. Mechanism unknown. Demo `no-match` (`youtube.com`).
- EcoAI: direct matched 108 real projects. 95 share `Sustainability`. The union also includes one sponsor-challenge string. Mechanism unknown, including the code-observed library claims, because those statements did not use the mechanism wording then in use (`built with`, dependency, or gallery technology). That measured result is a historical sample from before pull request #32. Demo `no-match` (`youtu.be`).

Direct mode still treats a shared sponsor-challenge string as a match. That is not a problem-domain assignment. Interaction analogues and distant structural analogues are not implemented. This second run was not repeated on the catalog that contains Kami, Spidey Sense, and Eve.

Mechanism mode, as merged in pull request #32 (https://github.com/bobshenruililin/HackathonRepo/pull/32, merge `fa743de0ebe088399ee0c290232e6beb456835a9`), now treats the text before `is code-observed as a library`, `framework`, or `language` as a technology token. A shared token can match. `ai`, `web`, and `technology` stay generic. The words `code-observed`, `library`, `framework`, `language`, `revision`, `manifest`, and `path` are not tokens by themselves. Built With, dependency, and gallery wording is unchanged. This is token matching on claim text. It is not evidence that the package is called. Code-evidence paths on those claims stay unknown. It is not a recommendation and not an award inference.

A later sample is `docs/MECHANISM_SAMPLE.md` (pull request #38). It called `retrieveAnalogues` on `catalog/hackmit/catalog.json` at catalog commit `55d231fef73450c9f964739cd803eed6e44b37eb`. That catalog file already contains Kami, Spidey Sense, and Eve. EcoAI mechanism `matched` 15 real projects: `Python` on 14, `Flask` on 4, and 3 share both. The `Python` query claim is code-observed as a language. 12 of those analogues use `built with` wording and 2 use a code-observed language claim. All 4 `Flask` analogues use `built with` wording. A shared token is not evidence the package is called. 2-Player Hot Potato, Window Share, TravelAR, and Wirehead are mechanism `unknown`. Wirehead direct still matches 330, including sponsor-challenge strings. Precision and recall stay **NOT MEASURED**. The earlier EcoAI mechanism `unknown` result stays the historical sample from before pull request #32.

`hackathon-atlas analogues` is on main (pull request #40, merge `f0b12f6ec444345d8791db1aa97ab5146848aeb1`). It reads `--catalog`, requires `--mode direct|mechanism|demo`, and takes either `--project` or an exact `--title`. An ambiguous title exits with the ids and does not pick one. Output is JSON with status, reason when present, and each analogue's project id and shared text. It does not print precision or recall. Search is unchanged.

The idea-precedent skill (`.cursor/skills/idea-precedent/SKILL.md`, pull request #42, merge `93d3ab705e8e5ea2837c2ef0c44e6787eb553463`) runs `hackathon-atlas analogues` on a caller-supplied catalog, in `direct`, `mechanism`, and `demo`. A hit may be cited with project id, shared text, and claim basis, and the claim stays unreviewed. `unknown` and `no-match` stay unknown. An empty accepted-value registry is not an empty corpus. Precision and recall stay **NOT MEASURED**.

## Tests

`pnpm test` on Node 24.21.0 at the code-observed claims commit, before pull request #28: schema 26, ingest 14, catalog-index 16, cli 14, eval 7, taxonomy 8, repo-observations 21, analogues 19. All passed. Pull request #28 added one analogue test. GitHub Actions "Install, typecheck, and test" passed on pull requests #27, #28, and #29. Local `pnpm test` on the #29 commit passed, including catalog-index 17 and analogues 20. This docs revision does not re-run the suite.

An earlier explorer check, before the filter pull request merged, used a generated index that served event names, paged results ("Showing 1–40 of 2180"), award plus a known repository (69 on that earlier catalog; the catalog now has more prize pages), Window Share, and 2-Player Hot Potato on track Beginner. Playwright was not re-run for that earlier check.

The explorer was checked over HTTP against a generated index of `catalog/hackmit/catalog.json` at commit `e05382b61d301ee02bc6106bc04278968878f2fb`. `catalog/hackmit/catalog.json` changed in pull request #44. That HTTP check used the catalog at `e05382b61d301ee02bc6106bc04278968878f2fb` and did not show the GreenPlanner, Unwrap, or Prophecy code-observed claims. The staging file from pull request #37 is not that catalog. The explorer project page changed in pull request #41. That HTTP check did not show the derived Gallery track. Node v24.21.0. Next.js dev server on 127.0.0.1. No browser and no Playwright. That check did not change code. `/` returned 200. Real records 2180, synthetic 0. Showing 1–40 of 2180. Event names included HackMIT 2016–2026, HackMIT'14, Blueprint 2025, and Blueprint 2026. `/?award=known&repository=known` returned 200. Showing 1–40 of 84 real projects. First listed match GeomPT. EcoAI `prj_06575f6b37c3f9323711a862` returned 200, including the statement `Flask is code-observed as a framework` with basis code-observed, and locator `https://github.com/kbhatnagar1506/ecoai`. This newer check is the one that saw that code-observed Flask statement. Compare of EcoAI and Unwrap by id and by exact title returned 200 and showed the titles as different.

## Still open

- `Preet37/money-maxing` was opened read-only. It does not match a catalog locator. `https://github.com/athm23/money-maxing` is a different owner and was not used.
- Eve's inspected URL lowercases to the catalog locator `https://github.com/kierancschmitt/eve`. Dependency names from the opened root `package.json` are attached. No new project was created.
- Eleven other inspected repositories stay unresolved. No project was created for them.
- The second analogue sample, on the catalog before Kami, Spidey Sense, and Eve, was not itself repeated. The EcoAI result that reported mechanism `unknown` was run before the pull request #32 matcher. That result stays a historical sample. `docs/MECHANISM_SAMPLE.md` is the later sample on the current catalog file.
- Direct mode still matches a shared sponsor-challenge string. That is not a problem-domain assignment. Interaction analogues and distant structural analogues are not built.
- GreenPlanner, Unwrap, and Prophecy have unreviewed code-observed claims in `catalog/hackmit/catalog.json`: 14 technology claims for GreenPlanner, 15 for Unwrap, and 1 for Prophecy (`Python`), plus one inspected-revision claim each. CampusMap still has no technology claims. Code-evidence paths stay unknown. This is not an award inference and not evidence the package is called.
- Removal intake is still undefined.
- The second security pass is done and does not accept M0.

Do not score the six fixed queries. Do not treat a sponsor challenge as a problem domain. Do not treat a missing gallery as an empty edition. M0 is not accepted.
