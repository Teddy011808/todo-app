# Todo API (NestJS + PostgreSQL)

Backend for the React Todo app in `../Todoapp_Front`. All routes start with `/api`.

## Run it

```bash
# 1. Start Postgres (first time only; afterwards: docker start todo-db)
docker run --name todo-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=todo -p 5432:5432 -d postgres:16

# 2. Install and create the tables
npm install
npm run typeorm -- migration:run -d src/data-source.ts

# 3. Start the API on http://localhost:3000
npm run start:dev
```

Then start the frontend: `cd ../Todoapp_Front && npm run dev`, and open http://localhost:5173.

Settings (port, CORS origin, database connection) live in `.env`. It is not committed to git:
copy `.env.example` to `.env` on a new machine (`cp .env.example .env`) and edit the values.

## Endpoints

| React feature | Method | Path | Returns |
|---|---|---|---|
| Show the list | GET | `/api/todos` | 200 + list |
| Create a to-do | POST | `/api/todos` | 201 + to-do, or 400 |
| Edit title, status or star | PATCH | `/api/todos/:id` | 200 + to-do, 400 or 404 |
| Delete a to-do | DELETE | `/api/todos/:id` | 204, or 404 |
| Username and profile | GET | `/api/profile` | 200 + profile |
| Edit profile form | PATCH | `/api/profile` | 200 + profile, or 400 |
| **Bonus:** bulk status | PATCH | `/api/todos/bulk` `{ ids, status }` | 200 + updated to-dos |
| **Bonus:** bulk delete | DELETE | `/api/todos/bulk` `{ ids }` | 204, or 404 |
| **Bonus:** filter / search | GET | `/api/todos?status=DONE&q=milk` | 200 + list |
| **Bonus:** drag-and-drop order | PATCH | `/api/todos/order` `{ ids }` | 200 + list in new order |
| **Bonus:** Undo a delete | POST | `/api/todos/restore` `{ ids }` | 201 + list, or 404 |

```
Todo    = { id, title, status: "TODO" | "IN_PROGRESS" | "DONE", starred, position, createdAt }
Profile = { username, displayName, email }
```

Deletes are soft deletes: a deleted to-do is kept for 10 minutes so Undo can bring it back,
then removed for good.

## Change the database

After editing an `*.entity.ts` file:

```bash
npm run typeorm -- migration:generate src/migrations/<name> -d src/data-source.ts
npm run typeorm -- migration:run -d src/data-source.ts
```

## Tests

```bash
docker exec todo-db psql -U postgres -c "CREATE DATABASE todo_test;"   # first time only
npm run test:e2e
```

The e2e tests build `todo_test` from the migrations and never touch your real data.
