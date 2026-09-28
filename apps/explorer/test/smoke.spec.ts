import { expect, test } from "@playwright/test";

test("shows separate real and synthetic counts from the generated index", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hackathon Atlas" })).toBeVisible();
  await expect(page.getByText("generated local index")).toBeVisible();
  await expect(page.getByTestId("index-status")).toHaveText("generated");
  await expect(page.getByTestId("real-count")).toHaveText("0");
  await expect(page.getByTestId("synthetic-count")).toHaveText("2");
});
