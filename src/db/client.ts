import * as SQLite from 'expo-sqlite';
import { openDatabase } from 'expo-sqlite';

// Initialize the database
const db = openDatabase('flowday.db');

export default db;