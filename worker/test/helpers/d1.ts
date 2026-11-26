import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const MIGRATIONS = fileURLToPath(new URL("../../../migrations", import.meta.url));

function toParam(value: unknown): SQLInputValue {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  return value as SQLInputValue;
}

class TestStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new TestStatement(this.db, this.sql, params.map(toParam));
  }

  async all<T>() {
    const results = this.db.prepare(this.sql).all(...this.params) as T[];
    return { results, success: true, meta: {} };
  }

  async first<T>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async run() {
    const result = this.db.prepare(this.sql).run(...this.params);
    return {
      results: [],
      success: true,
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

/** In-memory D1 look-alike with every migrations/*.sql applied, for Node-side tests. */
export function createTestDb() {
  const db = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  const d1 = {
    raw: db,
    prepare: (sql: string) => new TestStatement(db, sql),
    async batch(statements: TestStatement[]) {
      db.exec("BEGIN");
      try {
        const out = [];
        for (const statement of statements) out.push(await statement.run());
        db.exec("COMMIT");
        return out;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return d1 as unknown as D1Database & { raw: DatabaseSync };
}
