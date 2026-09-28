import { loadCatalog } from "./load-catalog.js";
import {
  createSchema,
  openDatabase,
  rebuildFts,
  resetDatabaseFile,
} from "./sqlite.js";
import type { BuildIndexOptions, RecordCounts } from "./types.js";
import { readCounts } from "./count-records.js";

export function buildIndex(options: BuildIndexOptions): RecordCounts {
  const records = loadCatalog(options.catalogDir);
  resetDatabaseFile(options.dbPath);
  const db = openDatabase(options.dbPath, false);
  try {
    createSchema(db);
    const insert = db.prepare(
      "INSERT INTO records (id, title, summary, synthetic, search_text, details_json) VALUES (?, ?, ?, ?, ?, ?)",
    );
    db.exec("BEGIN");
    try {
      for (const record of records) {
        insert.run(
          record.id,
          record.title,
          record.summary,
          record.synthetic ? 1 : 0,
          record.searchText,
          JSON.stringify(record.details),
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    rebuildFts(db);
    return readCounts(db);
  } finally {
    db.close();
  }
}
