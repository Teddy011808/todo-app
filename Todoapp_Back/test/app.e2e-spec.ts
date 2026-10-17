import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { dbOptions } from './../src/database/db-options.js';

// Build the test database from the real migrations
const migrations = Object.values(
  import.meta.glob<Record<string, new () => unknown>>(
    '../src/migrations/*.ts',
    {
      eager: true,
    },
  ),
).flatMap((module) => Object.values(module));

describe('Todo API (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;

  beforeAll(async () => {
    // Create the test database the first time
    const admin = new DataSource({ ...dbOptions(), database: 'postgres' });
    await admin.initialize();
    const database = String(dbOptions().database);
    const exists: unknown[] = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (exists.length === 0) await admin.query(`CREATE DATABASE "${database}"`);
    await admin.destroy();

    const ds = new DataSource({ ...dbOptions(), migrations });
    await ds.initialize();
    await ds.dropDatabase();
    await ds.runMigrations();
    await ds.destroy();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    await app.get(DataSource).query('TRUNCATE todos, profile RESTART IDENTITY');
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const create = async (title: string, status?: string) =>
    (
      await request(server)
        .post('/api/todos')
        .send({ title, status })
        .expect(201)
    ).body as { id: number; title: string; status: string };

  describe('the six required endpoints', () => {
    it('GET /api/todos returns 200 + list', async () => {
      await create('First');
      const res = await request(server).get('/api/todos').expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('POST /api/todos returns 201 + new to-do, or 400', async () => {
      const todo = await create('Buy milk');
      expect(todo).toMatchObject({
        id: 1,
        title: 'Buy milk',
        status: 'TODO',
        starred: false,
      });
      await request(server).post('/api/todos').send({ title: '' }).expect(400);
      await request(server)
        .post('/api/todos')
        .send({ title: '   ' })
        .expect(400);
      await request(server)
        .post('/api/todos')
        .send({ title: 'x', status: 'todo' })
        .expect(400);
      await request(server)
        .post('/api/todos')
        .send({ title: 'a'.repeat(201) })
        .expect(400);
    });

    it('PATCH /api/todos/:id returns 200 + to-do, or 404', async () => {
      const { id } = await create('Old title');
      const res = await request(server)
        .patch(`/api/todos/${id}`)
        .send({ title: 'New title', status: 'IN_PROGRESS' })
        .expect(200);
      expect(res.body).toMatchObject({
        title: 'New title',
        status: 'IN_PROGRESS',
      });
      await request(server)
        .patch('/api/todos/999')
        .send({ title: 'x' })
        .expect(404);
      await request(server)
        .patch('/api/todos/abc')
        .send({ title: 'x' })
        .expect(400);
    });

    it('DELETE /api/todos/:id returns 204, or 404', async () => {
      const { id } = await create('Delete me');
      await request(server).delete(`/api/todos/${id}`).expect(204);
      await request(server).delete(`/api/todos/${id}`).expect(404);
      await request(server).get(`/api/todos/${id}`).expect(404);
    });

    it('GET /api/profile returns 200 + profile', async () => {
      await request(server).get('/api/profile').expect(200, {
        username: 'teddy',
        displayName: 'Teddy',
        email: 'teddy@example.com',
      });
    });

    it('PATCH /api/profile returns 200 + profile, or 400', async () => {
      const res = await request(server)
        .patch('/api/profile')
        .send({ displayName: 'Teddy S', email: '' })
        .expect(200);
      expect(res.body).toEqual({
        username: 'teddy',
        displayName: 'Teddy S',
        email: '',
      });
      await request(server)
        .patch('/api/profile')
        .send({ email: 'bad' })
        .expect(400);
      await request(server)
        .patch('/api/profile')
        .send({ username: 'a b' })
        .expect(400);
      await request(server).patch('/api/profile').send({ id: 2 }).expect(400);
    });
  });

  it('data is stored in Postgres and survives a restart', async () => {
    await create('Persist me');
    await app.close();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    server = app.getHttpServer();

    const res = await request(server).get('/api/todos').expect(200);
    expect(res.body[0].title).toBe('Persist me');
  });

  describe('bonus endpoints', () => {
    it('PATCH /api/todos/bulk changes status of many', async () => {
      const a = await create('A');
      const b = await create('B');
      const res = await request(server)
        .patch('/api/todos/bulk')
        .send({ ids: [a.id, b.id], status: 'DONE' })
        .expect(200);
      expect(res.body.map((t: { status: string }) => t.status)).toEqual([
        'DONE',
        'DONE',
      ]);
    });

    it('DELETE /api/todos/bulk and Undo restore in the same place', async () => {
      const ids = [];
      for (const title of ['A', 'B', 'C', 'D'])
        ids.push((await create(title)).id);
      const before = (await request(server).get('/api/todos')).body;

      const toDelete = [before[1].id, before[3].id];
      await request(server)
        .delete('/api/todos/bulk')
        .send({ ids: toDelete })
        .expect(204);
      expect((await request(server).get('/api/todos')).body).toHaveLength(2);

      const after = await request(server)
        .post('/api/todos/restore')
        .send({ ids: toDelete })
        .expect(201);
      expect(after.body).toEqual(before);

      // Cannot restore twice, or restore something never deleted
      await request(server)
        .post('/api/todos/restore')
        .send({ ids: toDelete })
        .expect(404);
      await request(server)
        .post('/api/todos/restore')
        .send({ ids: [999] })
        .expect(404);
    });

    it('GET /api/todos?status=DONE filters by status', async () => {
      await create('Open');
      await create('Finished', 'DONE');
      const res = await request(server)
        .get('/api/todos?status=DONE')
        .expect(200);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual([
        'Finished',
      ]);
      await request(server).get('/api/todos?status=done').expect(400);
    });

    it('GET /api/todos?q=milk searches titles, case-insensitive', async () => {
      await create('Buy MILK');
      await create('Walk the dog');
      await create('100% done');
      const res = await request(server).get('/api/todos?q=milk').expect(200);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual([
        'Buy MILK',
      ]);
      // % is matched literally, not as a wildcard
      const pct = await request(server).get('/api/todos?q=%25').expect(200);
      expect(pct.body).toHaveLength(1);
      await request(server)
        .get(`/api/todos?q=${'a'.repeat(201)}`)
        .expect(400);
    });

    it('new todos appear first, PATCH /api/todos/order reorders', async () => {
      const a = await create('A');
      const b = await create('B');
      const c = await create('C');
      const titles = async () =>
        (await request(server).get('/api/todos')).body.map(
          (t: { title: string }) => t.title,
        );
      expect(await titles()).toEqual(['C', 'B', 'A']);

      await request(server)
        .patch('/api/todos/order')
        .send({ ids: [a.id, c.id, b.id] })
        .expect(200);
      expect(await titles()).toEqual(['A', 'C', 'B']);

      // Duplicates are rejected; unknown ids ignored, unlisted todos kept
      await request(server)
        .patch('/api/todos/order')
        .send({ ids: [a.id, a.id] })
        .expect(400);
      await request(server)
        .patch('/api/todos/order')
        .send({ ids: [b.id, 999] })
        .expect(200);
      expect(await titles()).toEqual(['B', 'A', 'C']);
    });

    it('PATCH /api/todos/:id { starred } marks priority', async () => {
      const { id } = await create('Important');
      const res = await request(server)
        .patch(`/api/todos/${id}`)
        .send({ starred: true })
        .expect(200);
      expect(res.body).toMatchObject({ starred: true, title: 'Important' });
      const starred = await request(server)
        .get('/api/todos?starred=true')
        .expect(200);
      expect(starred.body).toHaveLength(1);
    });
  });

  it('rate limits each client', async () => {
    for (let i = 0; i < 120; i++) await request(server).get('/api/profile');
    await request(server).get('/api/profile').expect(429);
  });
});
