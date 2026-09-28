import type { CatalogRecord, ListFilters } from "./types.js";

export function matchesFilters(record: CatalogRecord, filters: ListFilters): boolean {
  const basis = filters.basis ?? "";
  if (basis === "unknown") {
    if (record.details.claims.length > 0) {
      return false;
    }
  } else if (basis !== "" && !record.details.claims.some((claim) => claim.basis === basis)) {
    return false;
  }

  const reviewStatus = filters.reviewStatus ?? "";
  if (reviewStatus === "unknown") {
    if (record.details.claims.length > 0) {
      return false;
    }
  } else if (
    reviewStatus !== "" &&
    !record.details.claims.some((claim) => claim.reviewStatus === reviewStatus)
  ) {
    return false;
  }

  const eventId = filters.eventId ?? "";
  const knownEvent = record.details.submissions.some((item) => item.eventId.status === "known");
  if (eventId === "unknown") {
    if (knownEvent) {
      return false;
    }
  } else if (eventId !== "") {
    const matchesEvent = record.details.submissions.some(
      (item) => item.eventId.status === "known" && item.eventId.value === eventId,
    );
    if (!matchesEvent) {
      return false;
    }
  }

  const repository = filters.repository ?? "";
  const knownLocator = record.details.repositories.some((item) => item.locator.status === "known");
  if (repository === "unknown" && knownLocator) {
    return false;
  }
  if (repository === "known" && !knownLocator) {
    return false;
  }

  const award = filters.award ?? "";
  const awardClaim = record.details.claims.some((claim) => AWARD_CLAIM.test(claim.statement));
  if (award === "known" && !awardClaim) {
    return false;
  }
  if (award === "unknown" && awardClaim) {
    return false;
  }

  const track = filters.track?.trim() ?? "";
  const trackClaims = record.details.claims.filter((claim) => TRACK_CLAIM.test(claim.statement));
  if (track === "unknown" && trackClaims.length > 0) {
    return false;
  }
  if (track !== "" && track !== "unknown") {
    const needle = track.toLowerCase();
    if (!trackClaims.some((claim) => claim.statement.toLowerCase().includes(needle))) {
      return false;
    }
  }

  return true;
}

const AWARD_CLAIM = /\b(award|prize|winner)\b/i;
const TRACK_CLAIM = /\btrack\b/i;
