# Todo API (NestJS + PostgreSQL)

Backend for the React Todo app in `../Todoapp_Front`. All routes start with `/api`.

## Run it

```bash
npm run start:dev    # API on http://localhost:3000
```

Before it starts, `prestart:dev` runs `npm install` and `npm run db:up` (PostgreSQL and RabbitMQ in
Docker via `docker-compose.yml`, ports 5433 and 5672). Pending migrations run when the API starts.

Welcome emails need the worker, a separate process. In another terminal:

```bash
npm run worker       # reads email_queue and logs each welcome email
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
| Activity feed | GET | `/api/activity` | 200 + your latest 50 actions |
| **Bonus:** bulk status | PATCH | `/api/todos/bulk` `{ ids, status }` | 200 + updated to-dos |
| **Bonus:** bulk delete | DELETE | `/api/todos/bulk` `{ ids }` | 204, or 404 |
| **Bonus:** filter / search | GET | `/api/todos?status=DONE&q=milk` | 200 + list |
| **Bonus:** drag-and-drop order | PATCH | `/api/todos/order` `{ ids }` | 200 + list in new order |
| **Bonus:** Undo a delete | POST | `/api/todos/restore` `{ ids }` | 201 + list, or 404 |

```
Todo     = { id, title, status: "TODO" | "IN_PROGRESS" | "DONE", starred, position, createdAt }
Profile  = { username, displayName, email }
Activity = { id, message, createdAt }
```

Deletes are soft deletes: a deleted to-do is kept for 10 minutes so Undo can bring it back,
then removed for good.

## Background work

| Job | Tool | How it works |
|---|---|---|
| Activity feed | Event emitter | `TodosService` emits `todo.created`, `todo.updated` and `todo.deleted` after saving; `ActivityListener` writes the row. An event lost in a crash is an acceptable loss here. |
| Cleanup | `@Cron` | Every night at 02:00 Phnom Penh time, `CleanupTask` permanently deletes `DONE` todos not changed for 30 days and logs the count. Running on several replicas is safe: the second delete finds nothing. |
| Welcome email | RabbitMQ | Signup publishes a persistent `user.registered` to the durable `email_queue` and responds at once. The worker acks only after the email. |

The message can arrive twice (a crash after sending, before the ack), so a user may rarely get two
welcome emails. If RabbitMQ is down, signup still succeeds but that one email is not queued.

### Prove the queue works

Open the RabbitMQ UI at <http://localhost:15672> (guest / guest), Queues tab, `email_queue`. Signup
allows 5 requests a minute, so wait a minute between tests or restart the API.

| Test | Steps | Expected |
|---|---|---|
| Manual ack | Set `EMAIL_DELAY_MS=5000` in `.env`, run the worker, sign up 1 user | 1 Unacked during the delay, then 0 |
| A: queued processing | Stop the worker, sign up 5 users, start the worker | Ready = 5, then 5 emails logged and Ready = 0 |
| B: broker restart | Stop the worker, sign up 5 users, `docker compose restart rabbitmq`, start the worker | Still Ready = 5 after the restart; all 5 processed |
| C: crash before ack | With the 5 s delay, sign up 1 user, kill the worker during the delay, start it | Back to Ready, then logged with `redelivered: true` |

Screenshots of tests A to C:

<!-- Add your screenshots of tests A, B and C here -->

## Change the database

After editing an `*.entity.ts` file:

```bash
npm run typeorm -- migration:generate src/migrations/<name> -d src/data-source.ts
npm run typeorm -- migration:run -d src/data-source.ts
```

## Tests

```bash
npm run db:up        # make sure PostgreSQL is running (the tests fake RabbitMQ)
npm run test:e2e
```

The e2e tests create a separate `todo_test` database, build it from the migrations, and never touch your real data.
