# Todo API (NestJS + PostgreSQL)

Backend for the React Todo app in `../Todoapp_Front`. All routes start with `/api`.

## Run it

From the project root: `npm run back`. Or from this folder:

```bash
npm install
npm run db:up        # starts PostgreSQL in Docker (docker-compose.yml, port 5433)
npm run start:dev    # API on http://localhost:3000; pending migrations run on startup
```

Settings (port, database connection, optional `CORS_ORIGIN`) can be overridden in `.env`; see `.env.example`.
Without a `.env`, the defaults match `docker-compose.yml`.

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
npm run test:e2e
```

The e2e tests create a separate `todo_test` database, build it from the migrations, and never touch your real data.
