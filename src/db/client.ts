import { openDatabaseSync, type SQLiteBindParams, type SQLiteRunResult } from 'expo-sqlite';

const db = openDatabaseSync('flowday.db');

// Enable WAL mode for better performance
db.execSync('PRAGMA journal_mode = WAL;');
db.execSync('PRAGMA foreign_keys = ON;');

// Async wrapper around the synchronous API
export const runAsync = (sql: string, params?: SQLiteBindParams): Promise<SQLiteRunResult> => {
  return Promise.resolve(db.runSync(sql, params as SQLiteBindParams));
};

export const getAllAsync = <T>(sql: string, params?: SQLiteBindParams): Promise<T[]> => {
  return Promise.resolve(db.getAllSync(sql, params as SQLiteBindParams) as T[]);
};

export const getFirstAsync = <T>(sql: string, params?: SQLiteBindParams): Promise<T | null> => {
  return Promise.resolve((db.getFirstSync(sql, params as SQLiteBindParams) as T) ?? null);
};

export const execAsync = (sql: string): Promise<void> => {
  return Promise.resolve(db.execSync(sql));
};

export default {
  runAsync,
  getAllAsync,
  getFirstAsync,
  execAsync,
};
