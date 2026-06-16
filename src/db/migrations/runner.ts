import db from '../client';

const MIGRATIONS_TABLE = 'schema_migrations';

export async function runMigrations() {
  // Create migrations table if not exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Get list of applied migrations
  const appliedRows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`
  );
  const applied = new Set(appliedRows.map((r) => r.name));

  // Define migration files in order
  const migrations = [
    { name: '001_initial', sql: await import('./001_initial.sql?raw') },
    { name: '002_focus_notes_review', sql: await import('./002_focus_notes_review.sql?raw') },
  ];

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      continue;
    }
    console.log(`Running migration: ${migration.name}`);
    try {
      await db.execAsync(migration.sql.default);
      await db.runAsync(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
        [migration.name]
      );
      console.log(`Migration ${migration.name} applied`);
    } catch (error) {
      console.error(`Migration ${migration.name} failed:`, error);
      throw error;
    }
  }
}