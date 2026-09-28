# M1 coverage report

**Status: stopped.** No genuine project records were accepted. Collection did not start.

Checked `origin/main` at `589d87e491fe09fb8471d8c0ebce93ed0dda717e` on 2026-09-28. No new fetches were made for this report. Devpost was not requested. No catalog rows were written.

## Decision

25 genuine project records cannot be accepted from sources this repository already permits. The permitted set is empty. There is no approval reference to cite. Opening Devpost, rendering 2024, 2025, or CURRENT, or treating the archive as a project dataset would be a new collection pass. That pass is not authorized.

## What the registry contains

`sources/registry.yaml` has 47 candidates.

| `approval_status` | Count |
| --- | ---: |
| `discovered` | 29 |
| `permission-pending` | 18 |
| `approved` | 0 |

| `access_status` | Count |
| --- | ---: |
| `fetched` | 11 |
| `not-attempted` | 33 |
| `browser-rendering-dependent` | 3 |
| inaccessible | 0 |

`discovered` means the URL was seen in the source audit. It is not permission to collect participant projects.

## Participant projects

The only participant-project URLs are 18 `source_kind: project-page` rows. All are `https://devpost.com/software/...` hrefs seen on `https://archive.hackmit.org/2020/` under "Past HackMIT Projects". Each is `permission-pending`, `not-attempted`, and `event_edition: unknown`, observed at `2026-09-28T13:01:14Z`. They were not fetched. They are examples cited from the 2020 splash, not a verified roster. A year inside a slug was not treated as an edition. Eighteen unfetched hrefs are fewer than 25, and they are not two editions.

No Devpost authorization record is in this repository. Automated Devpost access stays disabled.

## Organizer infrastructure

Fetched edition pages for 2014–2023 are organizer splash pages, not project lists. `my.hackmit.org`, `github.com/techx`, go.hackmit.org links, and the 2016 splash license link are organizer infrastructure and were not fetched. They are not participant project records.

## Not inaccessible

No attempted request was inaccessible. None returned 403 or 429, and none failed before a response. Unfetched links are `not-attempted`. They are not empty and they are not inaccessible.

## Browser-rendering-dependent

These shells were fetched. Their scripts were read as text and not executed. The rendered DOM was not observed. Missing project indexes are not a claim that the edition has no projects.

| Id | URL | `observed_at` |
| --- | --- | --- |
| `edition-2024` | `https://archive.hackmit.org/2024/` | 2026-09-28T13:01:15Z |
| `edition-2025` | `https://archive.hackmit.org/2025/` | 2026-09-28T13:01:15Z |
| `current-site` | `https://hackmit.org/` | 2026-09-28T13:04:31Z |

`current-site` title text "HackMIT 2026" is source-reported. `event_edition` is unknown.

## Unknown, not permission-pending

`https://bparchive.hackmit.org`, `https://code.hackmit.org/`, `https://hackmit.substack.com/`, and the script-only hosts `plume`, `wii`, `china`, and `coolhackgames` are `discovered` and `not-attempted`. Their source kind is unknown. They were not fetched.

## Policy this report relies on

- `AGENTS.md`: the HackMIT archive is a discovery seed, not a project dataset. Collect only through approved source policies and access methods. Devpost automated collection is disabled unless explicitly authorized. Do not pursue a numerical target by inventing data.
- `DATA_POLICY.md`: collection is not approved. No owner-approved method list is in this repository. No Devpost authorization is recorded.
- `docs/M1_ACCEPTANCE.md`: every collected source needs an approval reference that already existed before the fetch. The archive URL is not that approval. A target number of projects is not an acceptance criterion.

## What would unblock a later slice

An owner approval, recorded before any fetch, that names the access method and the sources. Devpost still needs its own authorization record before any Devpost fetch or import. This report does not grant that approval.

## Not done

No pipeline, catalog, index of real projects, CLI search, or explorer slice was built for M1. Synthetic fixtures remain fixtures. They are not genuine projects.
