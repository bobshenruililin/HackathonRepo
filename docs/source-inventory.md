# HackMIT archive source inventory

This is a discovery audit of the event-site seed `https://archive.hackmit.org/` only. It is not a project dataset and not a mirror. Completed observation is separated from proposed collection below. A parsed registry does not prove that a page, URL, or title is factually correct.

`ops/STATE.md` was not in the repository at the start of this audit.

Requests used the client name `Hackathon Atlas source discovery`. `https://archive.hackmit.org/robots.txt` returned HTTP 200, `text/plain; charset=utf-8`, at 2026-09-28T13:00:38Z. The body was comments describing content signals. No `User-agent`, `Allow`, `Disallow`, or `Content-Signal` directive was present. No request returned 403 or 429. The audit stopped at the request bound and did not fetch again after that.

## How CURRENT was resolved

The seed does not give CURRENT a year. Three anchors use the href `https://hackmit.org`. The visible label on those controls is CURRENT.

That URL was fetched at 2026-09-28T13:04:31Z:

- HTTP status: 200
- Final URL: `https://hackmit.org/`
- Redirects: none
- Content-Type: `text/html; charset=utf-8`
- Last-Modified: Sun, 20 Sep 2026 03:48:19 GMT

The document is a client-rendered shell. The body is `<div id="root"></div>` plus the module script `/assets/index-D49HQaq3.js`. The title, `og:title`, and `og:site_name` contain the source-reported text "HackMIT 2026". The meta description contains the source-reported text "HackMIT 2026 is a 24-hour hackathon at MIT in Cambridge, Massachusetts." That text is not a resolved event year. `event_edition` for this source is unknown.

One classification hop had already fetched `https://hackmit.org/assets/index-D49HQaq3.js` at 2026-09-28T13:05:01Z (HTTP 200, `application/javascript; charset=utf-8`). The file was read as text and not executed. It repeats "HackMIT 2026" and includes a sentence naming Saturday, September 19th and Sunday, September 20th. Those strings stay source-reported text. They were not used to assign an edition. The rendered DOM was not opened in a browser.

## What the seed lists

`https://archive.hackmit.org/` returned HTTP 200 at 2026-09-28T13:00:51Z, final URL unchanged, `text/html; charset=utf-8`, Last-Modified Sat, 23 May 2026 01:45:15 GMT. The title text is "HackMIT Archive". The navbar links `/2014` through `/2025`, CURRENT, and "Blueprint Archive" (`https://bparchive.hackmit.org`). The seed is an edition index. It does not list participant projects.

Year links were followed once. Each final URL is `https://archive.hackmit.org/YYYY/` with HTTP 200 and `text/html; charset=utf-8`. Archive Last-Modified values are 23 May 2026. Those headers are server timestamps, not event dates.

## Participant-project sources

The only participant-project URLs observed are 18 `https://devpost.com/software/...` hrefs in the 2020 edition HTML, under the heading "Past HackMIT Projects". They are recorded individually in `sources/registry.yaml` with `source_kind: project-page`, `approval_status: permission-pending`, `access_status: not-attempted`, and `event_edition: unknown`.

They were not fetched. Devpost automated collection is disabled. A slug that happens to contain a year was not treated as an edition assignment. The heading says these are past projects cited from the 2020 splash page. This audit did not treat them as a complete roster, and it did not copy project names, descriptions, or awards.

No project-list page was found on the fetched edition documents for 2014–2019 or 2021–2023. The 2024, 2025, and CURRENT documents did not contain a project index in the HTML shell or in the one script read for each page. That is not a finding that those editions have no projects.

## Organizer infrastructure

These are organizer event sites or organizer tools. They are not participant project records.

Fetched edition pages, 2014–2023, are organizer splash pages (about, schedule, FAQ, sponsors, registration controls). Source-reported date text observed in those documents:

| Edition | What the page itself showed |
| --- | --- |
| 2014 | Title "HACKMIT - Oct 4-5". Visible text "Oct 4 - 5, 2014, MIT CAMPUS". |
| 2015 | Title "HACKMIT 2015". Schedule names "Saturday, Sept. 19" and "Sunday, Sept. 20" without a year beside those dates. |
| 2016 | Title "HACKMIT 2016". Visible text "SEPTEMBER 17-18 // 2016". |
| 2017 | Title "HACKMIT 2017". Visible text "SEPTEMBER 16-17 2017". |
| 2018 | Title "HACKMIT 2018". Visible text "Massachusetts Institute of Technology on September 15th-16th". |
| 2019 | Title "HACKMIT 2019". A sentence mentions walk-on availability on the morning of September 14th. No single event-date sentence was recorded. |
| 2020 | Title "HackMIT 2020". Visible text "September 18-20, 2020". Also cites the Devpost links above. |
| 2021 | Title "HackMIT 2021". Visible text "SEPTEMBER 18-19, 2021". |
| 2022 | Title "HackMIT 2022". Visible text "10.01 - 10.02" and "October 1-2, 2022". |
| 2023 | Title "HackMIT 2023". Visible text "Sept 16th-17th" and "September 16-17, 2023". |

2024 and 2025 are the same kind of organizer splash, delivered as client-rendered shells. See the browser-rendering section for what was and was not observed.

Linked organizer tools that were not fetched:

- `https://my.hackmit.org/` — Dashboard, confirmation portal, registration portal, admissions status, or Apply, depending on the edition page.
- `https://go.hackmit.org/volunteer` — 2020 mentor or judge signup.
- `https://go.hackmit.org/interest` — 2021 navbar apply control.
- `https://go.hackmit.org/volunteer22` — 2022 mentor or judge application.
- `https://go.hackmit.org/mentor-judge` — 2023 mentor or judge application. The same string also appears in the 2024, 2025, and current-site scripts.
- `http://go.hackmit.org/discord` — 2023 page, and the same string in the 2024 and current-site scripts.
- `https://github.com/techx` — anchor text "View TechX Github" on the 2021 page, also linked from 2022 and 2023.
- `https://github.com/techx/hackmit-splash/blob/master/LICENSE.txt` — 2016 page, beside the text "Released under" and "CC BY-SA". The file was not fetched. No license was selected.
- `https://code.hackmit.org/` — anchor text "Open source" on the 2016 and 2017 pages, also linked later. Not fetched, so its source kind stays unknown.
- `https://hackmit.substack.com/` — href on the 2022 and 2023 pages. Not fetched, so its source kind stays unknown.

Sponsor and social links appear on the splash pages. They were not recorded as participant-project sources and were not fetched.

URL strings seen only inside the already fetched scripts, and not requested, stay unknown: `https://plume.hackmit.org/`, `https://wii.hackmit.org`, `https://china.hackmit.org`, and `http://coolhackgames.hackmit.org/`.

## Inaccessible sources

No attempted request was inaccessible. None returned 403 or 429, and none failed before a response. Unfetched links in this inventory are not-attempted. They are not inaccessible.

## Permission-pending sources

Devpost automated collection is disabled. Every Devpost URL below was only seen as an href on `https://archive.hackmit.org/2020/`. `approval_status` is `permission-pending`. `access_status` is `not-attempted`. No Devpost URL was fetched or crawled.

- `https://devpost.com/software/detection-of-breast-cancer-based-on-image-analysis`
- `https://devpost.com/software/core-fh4pvs`
- `https://devpost.com/software/dispenser`
- `https://devpost.com/software/pilot-81xkaf`
- `https://devpost.com/software/verifast`
- `https://devpost.com/software/studydate-vxpws8`
- `https://devpost.com/software/text2test`
- `https://devpost.com/software/afar`
- `https://devpost.com/software/hackmit2019-qcu9y7`
- `https://devpost.com/software/onpause`
- `https://devpost.com/software/hackmit-xdjoke`
- `https://devpost.com/software/hackmit2019`
- `https://devpost.com/software/rap-scorer`
- `https://devpost.com/software/eye-in-the-sky-nm1l3k`
- `https://devpost.com/software/villager-49dkvf`
- `https://devpost.com/software/lgtm`
- `https://devpost.com/software/mpgreen`
- `https://devpost.com/software/homeup`

`https://bparchive.hackmit.org` is a separate link on the seed, labeled "Blueprint Archive". It was not fetched. It is not a HackMIT archive edition, and it is not permission-pending. Its source kind is unknown.

## Browser-rendering-dependent sources

These pages returned HTML, and the HTML is a shell. Failed text extraction is not an empty source.

- `https://archive.hackmit.org/2024/` — HTTP 200 at 2026-09-28T13:01:15Z. Title text "HackMIT 2024". Body is an empty root plus `./assets/index-BWncbrv6.js`.
- `https://archive.hackmit.org/2025/` — HTTP 200 at 2026-09-28T13:01:15Z. Title text "HackMIT 2025". Body is an empty root plus `assets/index-Cg_OwfxS.js`.
- `https://hackmit.org/` — HTTP 200 at 2026-09-28T13:04:31Z. Client-rendered shell described in the CURRENT section. Event year unknown.

The archive labels `/2024` and `/2025` as those editions. That label is the `event_edition` value. It does not mean the rendered page was reviewed.

One script hop was read as text for each of the three shells. Each script contained organizer splash and FAQ copy, including language about submitting a project to a track. None contained `devpost.com`. The 2024 script includes "HACKMIT 2024", "weekend of September 14–15", and the string "September 14, 2024". The 2025 script includes "HackMIT 2025" and "Saturday, September 13th" through "Sunday, September 14th". Reading those files did not open a browser, and it does not prove the rendered page has no project index.

## Completed observation and proposed collection

Completed in this audit:

- `robots.txt`, the seed, and the twelve year links on the seed.
- The CURRENT URL, recorded above.
- One non-Devpost classification hop for the three client-rendered shells: the module script referenced by each shell. The script was not executed.
- Identification of Devpost hrefs, organizer links, and the Blueprint Archive link, without fetching them.

Not done, and not proposed as finished work:

- No Devpost page was opened.
- No browser rendered 2024, 2025, or CURRENT.
- No project roster was collected.
- `https://bparchive.hackmit.org`, `https://my.hackmit.org/`, `https://code.hackmit.org/`, `https://github.com/techx`, the 2016 splash license URL, the `go.hackmit.org` links, and the script-only host strings were not requested.
- Edition pages for 2014–2023 were classified from their own HTML. No extra hop was taken from those pages.

A later collection pass could, if separately authorized, open the permission-pending Devpost URLs, fetch the unfetched organizer links, or render the three shells in a browser. This inventory does not do that, and it does not turn those routes into project records.

## Gaps

- CURRENT's event year is unknown. The string "HackMIT 2026" is source-reported shell text.
- 2019 has an edition label and no recorded single event-date sentence.
- 2015's schedule names September 19 and 20 without a year on those lines. The title is "HACKMIT 2015".
- No participant project index was observed for 2014–2019 or 2021–2025. That gap is not an empty edition.
- The 2020 Devpost links are examples under "Past HackMIT Projects", not a verified roster, and their edition is unknown.
- Sponsor sites were ignored as project sources.
- Server `Last-Modified` dates in May and September 2026 are not event dates.
