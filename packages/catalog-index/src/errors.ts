export class MissingIndexError extends Error {
  readonly dbPath: string;

  constructor(dbPath: string) {
    super(`Generated index does not exist: ${dbPath}`);
    this.name = "MissingIndexError";
    this.dbPath = dbPath;
  }
}
