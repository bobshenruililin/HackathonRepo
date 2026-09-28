import path from "node:path";

export function resolveIndexPath(): string {
  const configured = process.env.CATALOG_INDEX_PATH;
  if (configured !== undefined && configured !== "") {
    return path.resolve(configured);
  }
  return path.join(process.cwd(), ".data", "catalog.sqlite");
}
