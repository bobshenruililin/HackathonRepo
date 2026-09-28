# HackMIT catalog

This file is the canonical catalog produced by `@hackathon-atlas/ingest` 0.1.0 from public gallery cards fetched on 2026-09-28. It is schema 0.1.0. The generated SQLite index is not canonical and can be rebuilt from this file.

The cards came from public Devpost galleries, the Plume gallery API, and the Ballot gallery API. Blueprint is included as its own event family, not as a HackMIT edition. Eighteen Devpost project pages that the 2020 archive lists under past projects were fetched separately and merged when the project URL and title agreed. Sixty-two Devpost pages for 2016 and 2017 cards labeled only "Winner" were fetched and merged onto those same projects; they added prize names and, on 36 pages, a repository link. They did not add projects. Repository links were added only when a page or gallery payload stated the URL. Unresolved name matches were not merged.

| | |
| --- | --- |
| Projects | 2180 |
| Synthetic projects | 0 |
| Submissions | 2180 |
| Repository locators | 921 |
| Events | 12 |
| Evidence records | 2270 |
| Claims | 5904 |

Event names are the gallery's own title or client-script name: HackMIT (the 2013 Devpost page, which states October 5-6, 2013; 284 projects), HackMIT'14 (62), HackMIT 2016 (156), HackMIT 2017 (176), HackMIT 2018 (176), HackMIT 2019 (211), HackMIT 2023 (173), HackMIT 2024 (Ballot client script; 219), HackMIT 2025 (Plume; 319), HackMIT 2026 (Plume; 299), Blueprint 2025 (46), and Blueprint 2026 (59). The 2015 and 2020 Devpost galleries and the Plume indexes for 2022, 2023, and 2024 returned no project list. Blueprint 2023 and 2024 also returned no project list. A missing list is not an empty edition. Start and end times are unknown. Award text is present only where a card or project page stated it. Devpost gallery cards did not link repositories; Plume and Ballot payloads did, and some later Devpost project pages did. Built With tags are source-reported, not code-observed. Five repositories whose locators already matched a catalog project also have code-observed dependency claims from public manifest names at a pinned commit: The Cambridge Sock Company, EcoAI, Mozaic, HeartFrame, and Erbgut. That is 87 technology claims on those projects, plus one repository claim that an inspected revision was staged. Scoped npm package names are written without the leading at-sign, because this catalog does not store that character. Eleven other inspected repositories were not attached: the normalized locator was not already in the catalog. Code-evidence paths stay unknown; the claim statement names one manifest or file path. Review status is unreviewed.
