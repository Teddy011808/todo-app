# Todo App

A full-stack to-do app: a React frontend and a NestJS REST API backed by PostgreSQL.

| Folder | What it is |
|---|---|
| [`Todoapp_Front`](Todoapp_Front) | React + Vite app (tasks, filters, search, drag-and-drop, bulk actions, profile) |
| [`Todoapp_Back`](Todoapp_Back) | NestJS API with TypeORM, migrations and validation. See its [README](Todoapp_Back/README.md) for all endpoints |

## Run it locally

```bash
# 1. Database (first time; afterwards: docker start todo-db)
docker run --name todo-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=todo -p 5432:5432 -d postgres:16

# 2. Backend on http://localhost:3000
cd Todoapp_Back
cp .env.example .env
npm install
npm run typeorm -- migration:run -d src/data-source.ts
npm run start:dev

# 3. Frontend on http://localhost:5173 (in a second terminal)
cd Todoapp_Front
npm install
npm run dev
```
