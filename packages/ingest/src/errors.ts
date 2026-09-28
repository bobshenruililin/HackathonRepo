export class IngestError extends Error {
  readonly issues: readonly string[];

  constructor(issues: string | readonly string[]) {
    const list = typeof issues === "string" ? [issues] : [...issues];
    super(list.join("\n"));
    this.name = "IngestError";
    this.issues = list;
  }
}
