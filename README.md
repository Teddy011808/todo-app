# Todo App

A full-stack to-do app: a React frontend and a NestJS REST API backed by PostgreSQL.

| Folder | What it is |
|---|---|
| [`Todoapp_Front`](Todoapp_Front) | React + Vite app (tasks, filters, search, drag-and-drop, bulk actions, profile) |
| [`Todoapp_Back`](Todoapp_Back) | NestJS API with TypeORM, migrations and validation. See its [README](Todoapp_Back/README.md) for all endpoints |

## Run it

You need **Node.js 20.12+** and **Docker Desktop** (running). Then, from this folder, in two terminals:

```bash
npm run front   # React app  -> http://localhost:5173
npm run back    # API        -> http://localhost:3000/api
```

That's it. The commands can be run in either order. `npm run back` installs packages, starts PostgreSQL
in Docker (port 5433), creates the tables, and starts the API. The page connects by itself once the API is up.

Run the API tests with `npm test`.
