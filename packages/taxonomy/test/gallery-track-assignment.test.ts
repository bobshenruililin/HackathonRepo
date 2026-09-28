import { describe, expect, it } from "vitest";

import { assignHackmitTrackFromClaims } from "../src/index.js";

/**
 * Statement fixtures only. This file does not read the HackMIT catalog.
 */
describe("gallery track assignment", () => {
  it("assigns education from an exact Education sentence", () => {
    expect(
      assignHackmitTrackFromClaims([{ statement: "The gallery card names the track Education." }]),
    ).toEqual({ status: "value", value: "education" });
  });

  it("leaves the exact Beginner sentence unknown", () => {
    expect(
      assignHackmitTrackFromClaims([{ statement: "The gallery card names the track Beginner." }]),
    ).toEqual({ status: "unknown" });
  });
});
