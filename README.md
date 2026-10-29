# Expense Tracker

CLI для обліку витрат — рішення задачі [roadmap.sh/projects/expense-tracker](https://roadmap.sh/projects/expense-tracker).
Node.js ≥ 18, без залежностей. Дані зберігаються у `data/expenses.json`
(інший шлях можна задати змінною `EXPENSE_TRACKER_FILE`).

## Використання

```bash
node src/cli.js add --description "Lunch" --amount 20 --category food
node src/cli.js update --id 1 --amount 25
node src/cli.js delete --id 1
node src/cli.js list [--category food]
node src/cli.js summary                 # усі витрати
node src/cli.js summary --month 8       # серпень поточного року
node src/cli.js budget --month 8 --amount 500
node src/cli.js export --file out.csv
```

Щоб викликати як `expense-tracker ...`, виконай `npm link` у цій папці.

## Можливості

- Основні: add, update, delete, list, summary, summary за місяць.
- Додатково: категорії з фільтром, місячні бюджети з попередженням при перевищенні, експорт у CSV.
- Валідація: від'ємна/нульова/нечислова сума, порожній опис, неіснуючий ID, місяць поза 1–12.
  Від'ємну суму передавай як `--amount=-5`, інакше її сприйме як опцію.

## Структура

- `src/expenses.js` — чиста логіка (без I/O), покрита тестами
- `src/storage.js` — читання/запис JSON
- `src/cli.js` — розбір аргументів і команди
- `test/` — `npm test` (вбудований `node:test`)
