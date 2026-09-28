# ADR 0003: Overnight research and license

## Status

Accepted. Owner decision on 2026-09-28.

## Context

Original Hackathon Atlas code had no chosen license. Overnight research needs to read publicly accessible pages, and that read has to stay inside a written boundary.

## Decision

1. Original Hackathon Atlas code is under the MIT License. The copyright line is `Copyright (c) 2026 Shen Ruililin`. The grant is in `LICENSE`.
2. Third-party material stays under its own terms. Appearance in this repository or in the catalog does not relicense it.
3. The 2026-09-28 overnight goal authorizes ordinary read-only research of publicly accessible pages.
4. That research still must not bypass authentication, CAPTCHAs, or technical access controls; collect private data; expose credentials; hammer a host; or execute untrusted third-party code. Ordinary public reads back off on HTTP 403 and 429.
5. Devpost automation is not authorized as a bulk scraper. Ordinary public reads that back off on 403 and 429 remain allowed.
6. Public author or team names may be stored when needed for identity, attribution, provenance, or deduplication. Emails, phones, and schools are not collected.

## Rationale

Original code needs a redistribution term. MIT is the owner's choice for that code. Third-party pages, quotes, media, and repositories are not ours to relicense, so a catalog entry must not change their terms.

The overnight goal needs ordinary reads of public pages. The same decision keeps the access prohibitions, so those reads do not become a bypass, a hammer, a bulk scraper, or execution of untrusted code. A public author or team name is sometimes required to tell records apart and to attribute a claim. Contact details and schools are not.

## Boundary

- MIT covers original Hackathon Atlas code. It does not cover third-party text, images, media, or code.
- Ordinary read-only research of publicly accessible pages is allowed. Back off on HTTP 403 and 429.
- Not allowed: bypassing authentication, CAPTCHAs, or technical access controls; private data; credential exposure; reckless hammering; executing untrusted third-party code.
- Devpost is not authorized as a bulk scraper.
- Public author or team names may be stored only for identity, attribution, provenance, or deduplication. Emails, phones, and schools stay out.
- This ADR does not authorize publishing, deployment, paid services, or destructive operations.
- This ADR does not change `packages/schema`, `apps/explorer`, or an ingest package, and it does not invent project records.
