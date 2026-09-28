import { loadCatalog } from "./load-catalog.js";
import { loadSchemaCatalog } from "./schema-catalog.js";
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
  return writeIndex(options.dbPath, records);
}

export function buildSchemaIndex(options: { catalogFile: string; dbPath: string }): RecordCounts {
  const records = loadSchemaCatalog(options.catalogFile);
  return writeIndex(options.dbPath, records);
}

function writeIndex(dbPath: string, records: ReturnType<typeof loadCatalog>): RecordCounts {
  resetDatabaseFile(dbPath);
  const db = openDatabase(dbPath, false);
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
