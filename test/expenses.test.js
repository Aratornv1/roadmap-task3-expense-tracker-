import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyData, addExpense, updateExpense, deleteExpense, listExpenses, summarize,
  setBudget, budgetWarning, toCsv, UserError,
} from '../src/expenses.js';

const aug = new Date(2024, 7, 6); // 6 серпня 2024

function sample() {
  const data = emptyData();
  addExpense(data, { description: 'Lunch', amount: '20', category: 'food' }, aug);
  addExpense(data, { description: 'Dinner', amount: '10', category: 'food' }, aug);
  return data;
}

test('add assigns sequential ids and date', () => {
  const data = sample();
  assert.deepEqual(data.expenses.map((e) => e.id), [1, 2]);
  assert.equal(data.expenses[0].date, '2024-08-06');
});

test('ids are not reused after delete', () => {
  const data = sample();
  deleteExpense(data, 2);
  assert.equal(addExpense(data, { description: 'Tea', amount: 3 }, aug).id, 3);
});

test('rejects invalid amounts and empty description', () => {
  const data = emptyData();
  for (const amount of ['-5', '0', 'abc', undefined]) {
    assert.throws(() => addExpense(data, { description: 'x', amount }), UserError);
  }
  assert.throws(() => addExpense(data, { description: '  ', amount: 5 }), UserError);
});

test('update and delete fail for unknown id', () => {
  const data = sample();
  assert.throws(() => updateExpense(data, 99, { amount: 5 }), /not found/);
  assert.throws(() => deleteExpense(data, 99), /not found/);
  assert.throws(() => deleteExpense(data, 'abc'), UserError);
});

test('update changes only passed fields', () => {
  const data = sample();
  updateExpense(data, 1, { amount: '25.5' });
  assert.equal(data.expenses[0].amount, 25.5);
  assert.equal(data.expenses[0].description, 'Lunch');
  assert.throws(() => updateExpense(data, 1, {}), /Nothing to update/);
});

test('summary total, per month and per category', () => {
  const data = sample();
  addExpense(data, { description: 'Bus', amount: 2.5, category: 'transport' }, aug);
  addExpense(data, { description: 'Old', amount: 100 }, new Date(2023, 7, 1));
  assert.equal(summarize(data).total, 132.5);
  assert.deepEqual(summarize(data, { month: 8 }, aug), { total: 32.5, monthName: 'August' });
  assert.equal(summarize(data, { month: 7 }, aug).total, 0);
  assert.equal(summarize(data, { category: 'food' }).total, 30);
  assert.throws(() => summarize(data, { month: 13 }), UserError);
});

test('list filters by category case-insensitively', () => {
  const data = sample();
  addExpense(data, { description: 'Bus', amount: 2, category: 'Transport' }, aug);
  assert.equal(listExpenses(data, { category: 'transport' }).length, 1);
});

test('budget warning appears only when exceeded', () => {
  const data = sample();
  setBudget(data, 8, 50, aug);
  assert.equal(budgetWarning(data, 8, aug), null);
  addExpense(data, { description: 'Party', amount: 30 }, aug);
  assert.deepEqual(budgetWarning(data, 8, aug), { month: 'August', limit: 50, total: 60 });
  assert.equal(budgetWarning(data, 7, aug), null);
});

test('csv escapes commas and quotes', () => {
  const data = emptyData();
  addExpense(data, { description: 'Pizza, "large"', amount: 12 }, aug);
  assert.equal(
    toCsv(data.expenses),
    'ID,Date,Description,Category,Amount\n1,2024-08-06,"Pizza, ""large""",general,12\n',
  );
});
