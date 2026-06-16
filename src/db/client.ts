import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('flowday.db');

// Enable WAL mode for better performance
db.execSync('PRAGMA journal_mode = WAL;');
db.execSync('PRAGMA foreign_keys = ON;');

// Async wrapper around the synchronous API for backwards compatibility
export const runAsync = (sql: string, params?: any[]): Promise<void> => {
  return Promise.resolve(db.runSync(sql, params));
};

export const getAllAsync = <T>(sql: string, params?: any[]): Promise<T[]> => {
  return Promise.resolve(db.getAllSync(sql, params) as T[]);
};

export const getFirstAsync = <T>(sql: string, params?: any[]): Promise<T | null> => {
  return Promise.resolve((db.getFirstSync(sql, params) as T) ?? null);
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
