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
  let token: string;

  // Every request is sent as the logged-in test user
  const api = () =>
    request.agent(server).set('Authorization', `Bearer ${token}`);

  const login = async (email: string) => {
    const body = { email, password: 'secret123' };
    await request(server).post('/api/auth/signup').send(body).expect(201);
    const res = await request(server)
      .post('/api/auth/login')
      .send(body)
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };

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
    await app
      .get(DataSource)
      .query('TRUNCATE todos, profile, users, refresh_tokens RESTART IDENTITY');
    server = app.getHttpServer();
    token = await login('alice@test.dev');
  });

  afterEach(async () => {
    await app.close();
  });

  const create = async (title: string, status?: string) =>
    (await api().post('/api/todos').send({ title, status }).expect(201))
      .body as { id: number; title: string; status: string };

  describe('auth', () => {
    it('signup returns 201 { id, email } without the hash, 409 if taken', async () => {
      const body = { email: 'Bob@Test.dev', password: 'secret123' };
      const res = await request(server)
        .post('/api/auth/signup')
        .send(body)
        .expect(201);
      expect(res.body).toEqual({ id: 2, email: 'bob@test.dev' });
      await request(server).post('/api/auth/signup').send(body).expect(409);
      await request(server)
        .post('/api/auth/signup')
        .send({ email: 'nope', password: 'short' })
        .expect(400);
    });

    it('login with a wrong password or unknown email is 401', async () => {
      for (const email of ['alice@test.dev', 'ghost@test.dev']) {
        const res = await request(server)
          .post('/api/auth/login')
          .send({ email, password: 'wrongpass' })
          .expect(401);
        expect(res.body.message).toBe('Invalid credentials');
      }
    });

    it('routes need a valid token', async () => {
      await request(server).get('/api/todos').expect(401);
      await request(server)
        .get('/api/todos')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
      const me = await api().get('/api/auth/me').expect(200);
      expect(me.body).toMatchObject({ id: 1, email: 'alice@test.dev' });
      expect(me.body).not.toHaveProperty('passwordHash');
    });

    it('login allows 5 tries a minute', async () => {
      // beforeEach already used 1 login
      const wrong = { email: 'alice@test.dev', password: 'wrongpass' };
      for (let i = 0; i < 4; i++) {
        await request(server).post('/api/auth/login').send(wrong).expect(401);
      }
      await request(server).post('/api/auth/login').send(wrong).expect(429);
    });

    it('each user has their own profile', async () => {
      await api().patch('/api/profile').send({ displayName: 'Alice' });
      token = await login('bob@test.dev');
      const res = await api().get('/api/profile').expect(200);
      expect(res.body).toMatchObject({ displayName: 'bob' });
    });

    it('users only see and change their own todos', async () => {
      const mine = await create('Alice todo');
      token = await login('bob@test.dev');
      await create('Bob todo');

      const res = await api().get('/api/todos').expect(200);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual([
        'Bob todo',
      ]);
      await api().get(`/api/todos/${mine.id}`).expect(404);
      await api()
        .patch(`/api/todos/${mine.id}`)
        .send({ title: 'x' })
        .expect(404);
      await api().delete(`/api/todos/${mine.id}`).expect(404);
      await api()
        .patch('/api/todos/bulk')
        .send({ ids: [mine.id], status: 'DONE' })
        .expect(200, []);
      // The owner comes from the token, never from the body
      await api()
        .post('/api/todos')
        .send({ title: 'x', ownerId: 1 })
        .expect(400);
    });
  });

  describe('refresh + logout', () => {
    const refreshCookie = (res: request.Response) =>
      ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0] ?? '';

    it('login sets an HttpOnly refresh cookie; refresh rotates it', async () => {
      const browser = request.agent(server); // keeps cookies like a browser
      const body = { email: 'alice@test.dev', password: 'secret123' };
      const login = await browser.post('/api/auth/login').send(body);
      const cookie = refreshCookie(login);
      expect(cookie).toMatch(/^refresh_token=.+HttpOnly/);
      expect(cookie).toContain('Path=/api/auth');

      const res = await browser.post('/api/auth/refresh').expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(refreshCookie(res)).not.toBe(cookie);

      // The new access token works
      await request(server)
        .get('/api/todos')
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .expect(200);
    });

    it('reusing an old refresh token revokes every session', async () => {
      const body = { email: 'alice@test.dev', password: 'secret123' };
      const login = await request(server).post('/api/auth/login').send(body);
      const old = refreshCookie(login).split(';')[0];

      const first = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', old)
        .expect(200);
      const fresh = refreshCookie(first).split(';')[0];

      // Replayed right away (two tabs): still allowed
      await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', old)
        .expect(200);

      // Replayed later: someone copied it. 401, and the fresh one dies too
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 11_000);
      await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', old)
        .expect(401);
      await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', fresh)
        .expect(401);
      vi.useRealTimers();
    });

    it('refresh without a cookie is 401; logout revokes it', async () => {
      await request(server).post('/api/auth/refresh').expect(401);

      const browser = request.agent(server);
      const body = { email: 'alice@test.dev', password: 'secret123' };
      await browser.post('/api/auth/login').send(body);
      // No access token needed: it may have expired before the user clicks Logout
      await browser.post('/api/auth/logout').expect(204);
      await browser.post('/api/auth/refresh').expect(401);
    });
  });

  describe('the six required endpoints', () => {
    it('GET /api/todos returns 200 + list', async () => {
      await create('First');
      const res = await api().get('/api/todos').expect(200);
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
      await api().post('/api/todos').send({ title: '' }).expect(400);
      await api().post('/api/todos').send({ title: '   ' }).expect(400);
      await api()
        .post('/api/todos')
        .send({ title: 'x', status: 'todo' })
        .expect(400);
      await api()
        .post('/api/todos')
        .send({ title: 'a'.repeat(201) })
        .expect(400);
    });

    it('PATCH /api/todos/:id returns 200 + to-do, or 404', async () => {
      const { id } = await create('Old title');
      const res = await api()
        .patch(`/api/todos/${id}`)
        .send({ title: 'New title', status: 'IN_PROGRESS' })
        .expect(200);
      expect(res.body).toMatchObject({
        title: 'New title',
        status: 'IN_PROGRESS',
      });
      await api().patch('/api/todos/999').send({ title: 'x' }).expect(404);
      await api().patch('/api/todos/abc').send({ title: 'x' }).expect(400);
    });

    it('DELETE /api/todos/:id returns 204, or 404', async () => {
      const { id } = await create('Delete me');
      await api().delete(`/api/todos/${id}`).expect(204);
      await api().delete(`/api/todos/${id}`).expect(404);
      await api().get(`/api/todos/${id}`).expect(404);
    });

    it('GET /api/profile returns 200 + profile', async () => {
      await api().get('/api/profile').expect(200, {
        username: 'alice',
        displayName: 'alice',
        email: 'alice@test.dev',
      });
    });

    it('PATCH /api/profile returns 200 + profile, or 400', async () => {
      const res = await api()
        .patch('/api/profile')
        .send({ displayName: 'Alice S', email: '' })
        .expect(200);
      expect(res.body).toEqual({
        username: 'alice',
        displayName: 'Alice S',
        email: '',
      });
      await api().patch('/api/profile').send({ email: 'bad' }).expect(400);
      await api().patch('/api/profile').send({ username: 'a b' }).expect(400);
      await api().patch('/api/profile').send({ id: 2 }).expect(400);
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

    const res = await api().get('/api/todos').expect(200);
    expect(res.body[0].title).toBe('Persist me');
  });

  describe('bonus endpoints', () => {
    it('PATCH /api/todos/bulk changes status of many', async () => {
      const a = await create('A');
      const b = await create('B');
      const res = await api()
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
      const before = (await api().get('/api/todos')).body;

      const toDelete = [before[1].id, before[3].id];
      await api().delete('/api/todos/bulk').send({ ids: toDelete }).expect(204);
      expect((await api().get('/api/todos')).body).toHaveLength(2);

      const after = await api()
        .post('/api/todos/restore')
        .send({ ids: toDelete })
        .expect(201);
      expect(after.body).toEqual(before);

      // Cannot restore twice, or restore something never deleted
      await api()
        .post('/api/todos/restore')
        .send({ ids: toDelete })
        .expect(404);
      await api()
        .post('/api/todos/restore')
        .send({ ids: [999] })
        .expect(404);
    });

    it('GET /api/todos?status=DONE filters by status', async () => {
      await create('Open');
      await create('Finished', 'DONE');
      const res = await api().get('/api/todos?status=DONE').expect(200);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual([
        'Finished',
      ]);
      await api().get('/api/todos?status=done').expect(400);
    });

    it('GET /api/todos?q=milk searches titles, case-insensitive', async () => {
      await create('Buy MILK');
      await create('Walk the dog');
      await create('100% done');
      const res = await api().get('/api/todos?q=milk').expect(200);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual([
        'Buy MILK',
      ]);
      // % is matched literally, not as a wildcard
      const pct = await api().get('/api/todos?q=%25').expect(200);
      expect(pct.body).toHaveLength(1);
      await api()
        .get(`/api/todos?q=${'a'.repeat(201)}`)
        .expect(400);
    });

    it('new todos appear first, PATCH /api/todos/order reorders', async () => {
      const a = await create('A');
      const b = await create('B');
      const c = await create('C');
      const titles = async () =>
        (await api().get('/api/todos')).body.map(
          (t: { title: string }) => t.title,
        );
      expect(await titles()).toEqual(['C', 'B', 'A']);

      await api()
        .patch('/api/todos/order')
        .send({ ids: [a.id, c.id, b.id] })
        .expect(200);
      expect(await titles()).toEqual(['A', 'C', 'B']);

      // Duplicates are rejected; unknown ids ignored, unlisted todos kept
      await api()
        .patch('/api/todos/order')
        .send({ ids: [a.id, a.id] })
        .expect(400);
      await api()
        .patch('/api/todos/order')
        .send({ ids: [b.id, 999] })
        .expect(200);
      expect(await titles()).toEqual(['B', 'A', 'C']);
    });

    it('PATCH /api/todos/:id { starred } marks priority', async () => {
      const { id } = await create('Important');
      const res = await api()
        .patch(`/api/todos/${id}`)
        .send({ starred: true })
        .expect(200);
      expect(res.body).toMatchObject({ starred: true, title: 'Important' });
      const starred = await api().get('/api/todos?starred=true').expect(200);
      expect(starred.body).toHaveLength(1);
    });
  });

  it('rate limits each client', async () => {
    for (let i = 0; i < 120; i++) await api().get('/api/profile');
    await api().get('/api/profile').expect(429);
  });
});
