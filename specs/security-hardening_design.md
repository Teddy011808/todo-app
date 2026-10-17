# Security hardening: Todo API

## Scope
Harden the existing NestJS API (`Todoapp_Back`) and React client (`Todoapp_Front`).
Authentication is **out of scope** and is tracked separately (see "Open items").

## Acceptance criteria
1. `PUT /todos/order` never duplicates or drops a todo, even when ids repeat or are unknown.
2. Undo can only bring back todos the server itself deleted. A client cannot create todos
   with an id, title or `createdAt` it chose.
3. Request sizes are bounded: at most 100 ids per bulk call, 1000 ids per reorder,
   1000 todos in total, and a search string of at most 200 characters.
4. Each client is rate limited (120 requests per minute). Going over the limit returns 429.
5. Responses carry the standard security headers (helmet).
6. The client enforces the same length limits as the server (title 500, name and role 80).
7. All existing behavior (add, edit, star, status, bulk actions, delete and Undo, reorder,
   profile) keeps working, and the e2e tests cover the new rules.

## Design

### Backend
- **Reorder:** reject duplicate ids in the DTO (`@ArrayUnique`), and dedupe in the
  service as defense in depth.
- **Restore:** when the service deletes todos, it keeps them in a short-lived
  `recentlyDeleted` map for 10 minutes, the same window an Undo toast would need.
  `POST /todos/restore` now takes `{ ids }`, and only ids found in that map are restored,
  at their original index. Unknown or expired ids are ignored. Client-supplied todo bodies
  are no longer accepted.
- **Limits:** `@ArrayMaxSize` on every id list, `@MaxLength` on `search`, and a cap of
  1000 todos (`POST` returns 400 above it). The JSON body limit stays at Express's
  default of 100kb.
- **Rate limit:** `@nestjs/throttler` as a global guard.
- **Headers:** `helmet()` in `main.ts`.
- **Logging:** a Nest `Logger` records deletes, restores and rejected requests
  (400 and 429), without logging request bodies.

### Frontend
- `api.restoreTodos(ids)` sends only ids.
- `maxLength` on the title, edit, name and role inputs, matching the server.
- No change to rendering: React escapes all text, and there are no `innerHTML` sinks.

### Security notes
| Risk | Mitigation |
|------|------------|
| Data tampering via restore | Restore is limited to ids from the server's recently-deleted store |
| Memory exhaustion / DoS | Array size caps, todo cap, rate limit, body size limit |
| XSS | React escaping; helmet sets nosniff and related headers |
| Injection | Not applicable (no database yet). Use parameterized queries or an ORM when one is added |
| Unauthenticated access | **Open item:** add auth before deploying anywhere public |

## Open items
- Authentication and per-user data (users, login, JWT guard, ownership checks on every
  `:id`). Without it, every caller shares one todo list and one profile.
