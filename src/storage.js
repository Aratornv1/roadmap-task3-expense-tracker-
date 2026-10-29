import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyData, UserError } from './expenses.js';

const defaultFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'expenses.json');

export const dataFile = () => process.env.EXPENSE_TRACKER_FILE || defaultFile;

export function load(file = dataFile()) {
  if (!existsSync(file)) return emptyData();
  try {
    return { ...emptyData(), ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    throw new UserError(`Data file is corrupted: ${file}`);
  }
}

export function save(data, file = dataFile()) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
