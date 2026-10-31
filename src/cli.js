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
`;// save text  and usage instructions for the expense tracker CLI tool

const options = {
  id: { type: 'string' },
  description: { type: 'string', short: 'd' },
  amount: { type: 'string', short: 'a' },
  category: { type: 'string', short: 'c' },
  month: { type: 'string', short: 'm' },
  file: { type: 'string', short: 'f' },
  help: { type: 'boolean', short: 'h' },
}; // define command-line options and their types for the expense tracker CLI tool


function warnIfOverBudget(data, date) {
  const month = Number(date.slice(5, 7)); // 2026-10-07 = 10
  const w = budgetWarning(data, month);
  if (w) {
    console.warn(`Warning: ${w.month} budget exceeded (${formatMoney(w.total)} of ${formatMoney(w.limit)}).`);// check if total expenses for the month exceed the budget limit, log warning message if exceeded
  }
}// check if total expenses for the month exceed the budget limit, log warning message if exceeded

const commands = {
  add(data, v) {
    const e = addExpense(data, v);
    save(data);
    console.log(`Expense added successfully (ID: ${e.id})`);
    warnIfOverBudget(data, e.date);
  }, // add a new expense, save data, log success message, check for budget warning

  update(data, v) {
    const e = updateExpense(data, v.id, v);
    save(data);
    console.log(`Expense updated successfully (ID: ${e.id})`);
    warnIfOverBudget(data, e.date);
  }, // update an existing expense, save data, log success message, check for budget warning

  delete(data, v) {
    deleteExpense(data, v.id);
    save(data);
    console.log('Expense deleted successfully');
  }, // delete an expense, save data, log success message

  list(data, v) {
    const expenses = listExpenses(data, v);
    console.log(expenses.length ? formatTable(expenses) : 'No expenses found.');
  }, // show a list of expenses, optionally filtered by category, log formatted table or message if no expenses found

  summary(data, v) {
    const { total, monthName } = summarize(data, v);
    console.log(monthName
      ? `Total expenses for ${monthName}: ${formatMoney(total)}`
      : `Total expenses: ${formatMoney(total)}`);
    if (v.month !== undefined) {
      const w = budgetWarning(data, v.month);
      if (w) console.warn(`Warning: budget of ${formatMoney(w.limit)} exceeded.`);
    }
  }, // show a summary of expenses, optionally filtered by month, log total and budget warning if exceeded

  budget(data, v) {
    const b = setBudget(data, v.month, v.amount);
    save(data);
    console.log(`Budget for ${b.key} set to ${formatMoney(b.amount)}`);
  }, // set a budget for a specific month, save data, log success message

  export(data, v) {
    const file = v.file || `expenses-${isoDate()}.csv`;
    writeFileSync(file, toCsv(listExpenses(data, v)));
    console.log(`Exported to ${file}`);
  },
};// export expenses to a CSV file, optionally filtered by category, log success message with file name

function main(argv) {
  const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true });
  const [name] = positionals;
  if (!name || values.help) return console.log(HELP);
  if (!Object.hasOwn(commands, name)) throw new UserError(`Unknown command: ${name}\n\n${HELP}`);
  commands[name](load(), values);
}// parse command-line arguments, load data, execute the specified command, and handle errors

try {
  main(process.argv.slice(2));
} catch (err) {
  const known = err instanceof UserError || err?.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION'
    || err?.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE';
  console.error(known ? `Error: ${err.message}` : err);
  process.exitCode = 1;
}// execute the main function and handle any errors, logging known errors with a message and setting the exit code to 1
