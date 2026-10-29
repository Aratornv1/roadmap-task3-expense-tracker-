#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import {
  UserError, addExpense, updateExpense, deleteExpense, listExpenses, summarize,
  setBudget, budgetWarning, toCsv, formatMoney, formatTable, isoDate,
} from './expenses.js';
import { load, save } from './storage.js';

const HELP = `Usage: expense-tracker <command> [options]

Commands:
  add     --description <text> --amount <n> [--category <name>]
  update  --id <n> [--description <text>] [--amount <n>] [--category <name>]
  delete  --id <n>
  list    [--category <name>]
  summary [--month <1-12>] [--category <name>]
  budget  --month <1-12> --amount <n>
  export  [--file <path>] [--category <name>]
`;

const options = {
  id: { type: 'string' },
  description: { type: 'string', short: 'd' },
  amount: { type: 'string', short: 'a' },
  category: { type: 'string', short: 'c' },
  month: { type: 'string', short: 'm' },
  file: { type: 'string', short: 'f' },
  help: { type: 'boolean', short: 'h' },
};

// Попередження про перевищення бюджету місяця, у якому зроблено витрату.
function warnIfOverBudget(data, date) {
  const month = Number(date.slice(5, 7));
  const w = budgetWarning(data, month);
  if (w) {
    console.warn(`Warning: ${w.month} budget exceeded (${formatMoney(w.total)} of ${formatMoney(w.limit)}).`);
  }
}

const commands = {
  add(data, v) {
    const e = addExpense(data, v);
    save(data);
    console.log(`Expense added successfully (ID: ${e.id})`);
    warnIfOverBudget(data, e.date);
  },

  update(data, v) {
    const e = updateExpense(data, v.id, v);
    save(data);
    console.log(`Expense updated successfully (ID: ${e.id})`);
    warnIfOverBudget(data, e.date);
  },

  delete(data, v) {
    deleteExpense(data, v.id);
    save(data);
    console.log('Expense deleted successfully');
  },

  list(data, v) {
    const expenses = listExpenses(data, v);
    console.log(expenses.length ? formatTable(expenses) : 'No expenses found.');
  },

  summary(data, v) {
    const { total, monthName } = summarize(data, v);
    console.log(monthName
      ? `Total expenses for ${monthName}: ${formatMoney(total)}`
      : `Total expenses: ${formatMoney(total)}`);
    if (v.month !== undefined) {
      const w = budgetWarning(data, v.month);
      if (w) console.warn(`Warning: budget of ${formatMoney(w.limit)} exceeded.`);
    }
  },

  budget(data, v) {
    const b = setBudget(data, v.month, v.amount);
    save(data);
    console.log(`Budget for ${b.key} set to ${formatMoney(b.amount)}`);
  },

  export(data, v) {
    const file = v.file || `expenses-${isoDate()}.csv`;
    writeFileSync(file, toCsv(listExpenses(data, v)));
    console.log(`Exported to ${file}`);
  },
};

function main(argv) {
  const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true });
  const [name] = positionals;
  if (!name || values.help) return console.log(HELP);
  if (!Object.hasOwn(commands, name)) throw new UserError(`Unknown command: ${name}\n\n${HELP}`);
  commands[name](load(), values);
}

try {
  main(process.argv.slice(2));
} catch (err) {
  const known = err instanceof UserError || err?.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION'
    || err?.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE';
  console.error(known ? `Error: ${err.message}` : err);
  process.exitCode = 1;
}
