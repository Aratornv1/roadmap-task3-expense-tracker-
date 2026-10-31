import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyData, UserError } from './expenses.js';

const defaultFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'expenses.json'); //  default data file path in the project directory

export const dataFile = () => process.env.EXPENSE_TRACKER_FILE || defaultFile; // get data file path from environment variable or use default

export function load(file = dataFile()) {
  if (!existsSync(file)) return emptyData();
  try {
    return { ...emptyData(), ...JSON.parse(readFileSync(file, 'utf8')) }; // read and parse JSON data from file, merge with empty data object to ensure all properties exist
  } catch {
    throw new UserError(`Data file is corrupted: ${file}`);
  } 
} // check if data file exists, read and parse JSON, return data object, throw error if corrupted

export function save(data, file = dataFile()) { 
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); // create directory if it doesn't exist, write data object as formatted JSON to file
}
