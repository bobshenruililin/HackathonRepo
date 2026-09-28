import { expect, test } from "@playwright/test";

const plainId = "synthetic-fixture-not-a-real-project";
const extraId = "synthetic-smoke-extra-not-a-real-project";

test("does not present synthetic fixtures as real projects", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (request) => {
    urls.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByTestId("real-corpus-status")).toHaveText("There are no real projects.");
  await expect(page.getByTestId("real-project-list").getByRole("listitem")).toHaveCount(0);
  await expect(page.getByTestId("synthetic-records").getByRole("listitem")).toHaveCount(2);
  await expect(page.getByTestId("synthetic-label")).toHaveCount(2);
  await expect(page.getByTestId("synthetic-records")).toContainText("Not a real project");
  await expect(page.getByTestId("real-projects")).not.toContainText("SYNTHETIC FIXTURE");
  await expect(page.getByTestId("real-projects")).not.toContainText("SYNTHETIC SMOKE FIXTURE");

  await page.getByLabel("Keyword").fill("SMOKE");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByTestId("real-corpus-status")).toHaveText("There are no real projects.");
  await expect(page.getByTestId("real-project-list").getByRole("listitem")).toHaveCount(0);
  await expect(page.getByTestId("synthetic-records").getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("synthetic-records")).toContainText("SYNTHETIC SMOKE FIXTURE");

  await page.goto(`/?basis=unknown`);
  await expect(page.getByTestId("synthetic-records").getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("synthetic-records")).toContainText(
    "SYNTHETIC FIXTURE: Not a real hackathon project",
  );
  await expect(page.getByTestId("real-project-list").getByRole("listitem")).toHaveCount(0);

  await page.goto(`/?basis=source-reported`);
  await expect(page.getByTestId("synthetic-records").getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("synthetic-records")).toContainText("SYNTHETIC SMOKE FIXTURE");
  await expect(page.getByTestId("real-corpus-status")).toHaveText("There are no real projects.");

  await page.goto(`/?repository=known`);
  await expect(page.getByTestId("synthetic-records")).toContainText("SYNTHETIC SMOKE FIXTURE");
  await expect(page.getByTestId("real-project-list").getByRole("listitem")).toHaveCount(0);

  await page.goto(`/?eventId=unknown`);
  await expect(page.getByTestId("synthetic-records").getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("synthetic-records")).toContainText(
    "SYNTHETIC FIXTURE: Not a real hackathon project",
  );

  await page.goto(`/projects/${plainId}`);
  await expect(page.getByTestId("project-reality")).toHaveText("Not a real project");
  await expect(page.getByTestId("source-facts")).toBeVisible();
  await expect(page.getByTestId("derived-fields")).toBeVisible();
  await expect(page.getByTestId("unknowns")).toContainText("Unknown");
  await expect(page.getByTestId("evidence")).toContainText("Unknown");
  await expect(page.getByTestId("evidence")).not.toContainText("example.invalid");
  await expect(page.getByTestId("real-corpus-status")).toHaveText("There are no real projects.");

  await page.goto(`/projects/${extraId}`);
  await expect(page.getByTestId("project-reality")).toHaveText("Not a real project");
  await expect(page.getByTestId("evidence")).toContainText("https://example.invalid/synthetic/smoke-source");
  await expect(page.getByTestId("submissions")).toContainText("sub_synthetic_smoke");
  await expect(page.getByTestId("submissions")).toContainText("Unknown");
  await expect(page.getByTestId("repositories")).toContainText(
    "https://example.invalid/synthetic/smoke-repo",
  );
  await expect(page.getByTestId("derived-fields")).toContainText("Derived");

  await page.goto(`/compare?left=${plainId}&right=${extraId}`);
  await expect(page.getByTestId("compare-left-reality")).toHaveText("Not a real project");
  await expect(page.getByTestId("compare-right-reality")).toHaveText("Not a real project");
  await expect(page.getByTestId("compare-left-evidence")).toContainText("Unknown");
  await expect(page.getByTestId("compare-right-evidence")).toContainText(
    "https://example.invalid/synthetic/smoke-source",
  );
  await expect(page.getByText("No model API is used.")).toBeVisible();
  await expect(page.getByTestId("real-corpus-status")).toHaveText("There are no real projects.");

  await page.goto("/projects/not-in-the-index");
  await expect(page.getByTestId("project-reality")).toContainText("Unknown");
  await expect(page.getByTestId("project-title")).toHaveCount(0);

  expect(urls.length).toBeGreaterThan(0);
  expect(urls.every((url) => url.startsWith("http://127.0.0.1:3000"))).toBe(true);
});
