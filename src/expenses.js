// Чисті функції без вводу/виводу — їх легко тестувати.

export class UserError extends Error {}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const emptyData = () => ({ nextId: 1, expenses: [], budgets: {} });

const round2 = (n) => Math.round(n * 100) / 100;

export function parseAmount(value) {
  const amount = Number(value);
  if (value === undefined || value === '' || !Number.isFinite(amount)) {
    throw new UserError('Amount must be a number.');
  }
  if (amount <= 0) throw new UserError('Amount must be greater than zero.');
  return round2(amount);
}

export function parseMonth(value) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new UserError('Month must be an integer from 1 to 12.');
  }
  return month;
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new UserError('ID must be a positive integer.');
  return id;
}

export function parseDescription(value) {
  const description = typeof value === 'string' ? value.trim() : '';
  if (!description) throw new UserError('Description is required.');
  return description;
}

export function isoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

function findExpense(data, id) {
  const expense = data.expenses.find((e) => e.id === id);
  if (!expense) throw new UserError(`Expense with ID ${id} not found.`);
  return expense;
}

export function addExpense(data, { description, amount, category }, now = new Date()) {
  const expense = {
    id: data.nextId,
    date: isoDate(now),
    description: parseDescription(description),
    amount: parseAmount(amount),
    category: category?.trim() || 'general',
  };
  data.nextId += 1;
  data.expenses.push(expense);
  return expense;
}

export function updateExpense(data, id, { description, amount, category }) {
  const expense = findExpense(data, parseId(id));
  if (description === undefined && amount === undefined && category === undefined) {
    throw new UserError('Nothing to update: pass --description, --amount or --category.');
  }
  if (description !== undefined) expense.description = parseDescription(description);
  if (amount !== undefined) expense.amount = parseAmount(amount);
  if (category !== undefined) expense.category = category.trim() || 'general';
  return expense;
}

export function deleteExpense(data, id) {
  const expense = findExpense(data, parseId(id));
  data.expenses = data.expenses.filter((e) => e.id !== expense.id);
  return expense;
}

export function listExpenses(data, { category } = {}) {
  if (!category) return data.expenses;
  const wanted = category.trim().toLowerCase();
  return data.expenses.filter((e) => e.category.toLowerCase() === wanted);
}

// Підсумок за все життя або за місяць поточного року.
export function summarize(data, { month, category } = {}, now = new Date()) {
  let expenses = listExpenses(data, { category });
  let monthNumber;
  if (month !== undefined) {
    monthNumber = parseMonth(month);
    const prefix = monthKey(now.getFullYear(), monthNumber);
    expenses = expenses.filter((e) => e.date.startsWith(prefix));
  }
  const total = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
  return { total, monthName: monthNumber ? MONTH_NAMES[monthNumber - 1] : undefined };
}

export function setBudget(data, month, amount, now = new Date()) {
  const key = monthKey(now.getFullYear(), parseMonth(month));
  data.budgets[key] = parseAmount(amount);
  return { key, amount: data.budgets[key] };
}

// Повертає null, якщо ліміт не заданий або не перевищений.
export function budgetWarning(data, month, now = new Date()) {
  const monthNumber = parseMonth(month);
  const limit = data.budgets[monthKey(now.getFullYear(), monthNumber)];
  if (limit === undefined) return null;
  const { total } = summarize(data, { month: monthNumber }, now);
  if (total <= limit) return null;
  return { month: MONTH_NAMES[monthNumber - 1], limit, total };
}

const csvCell = (value) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(expenses) {
  const header = 'ID,Date,Description,Category,Amount';
  const rows = expenses.map((e) =>
    [e.id, e.date, e.description, e.category, e.amount].map(csvCell).join(','),
  );
  return [header, ...rows].join('\n') + '\n';
}

export function formatMoney(n) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

export function formatTable(expenses) {
  const rows = [['ID', 'Date', 'Description', 'Category', 'Amount']];
  for (const e of expenses) {
    rows.push([String(e.id), e.date, e.description, e.category, formatMoney(e.amount)]);
  }
  const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => r[col].length)));
  return rows.map((r) => r.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd()).join('\n');
}
