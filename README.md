# Todo App

A full-stack to-do app: a React frontend and a NestJS REST API backed by PostgreSQL.

| Folder | What it is |
|---|---|
| [`Todoapp_Front`](Todoapp_Front) | React + Vite app (tasks, filters, search, drag-and-drop, bulk actions, profile) |
| [`Todoapp_Back`](Todoapp_Back) | NestJS API with TypeORM, migrations and validation. See its [README](Todoapp_Back/README.md) for all endpoints |

## Run it

You need **Node.js 20.12+** and **Docker Desktop** (running). Then, in two terminals:

```bash
cd Todoapp_Front && npm run dev          # React app -> http://localhost:5173
cd Todoapp_Back  && npm run start:dev    # API       -> http://localhost:3000/api
```

That's it, in either order. Before starting, each command installs its packages automatically
(npm `predev` / `prestart:dev` scripts). The backend also starts PostgreSQL in Docker (port 5433) and
creates the tables. The page connects by itself once the API is up.

Run the API tests with `cd Todoapp_Back && npm run test:e2e`.
