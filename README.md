# Coy - Discover tab

Swipe based Discover tab for Coy, built as a standalone app for the SDE intern assignment.
Swipe right to like, left to pass. If both people like each other it's a match. Likes are never
shown to anyone unless they're mutual.

- `frontend/` - Next.js 16, Tailwind, `motion` for the swipe animations
- `backend/` - Express 5 + TypeScript, Prisma + PostgreSQL, zod, winston, vitest/supertest

The frontend proxies `/api/*` to the backend (Next.js rewrite), so there is no CORS setup.

## Running locally

Needs Node 22+, pnpm and Docker.

```bash
# backend
cd backend
docker compose up -d      # postgres on port 5441 (also creates coy_test for tests)
cp .env.example .env
pnpm install
pnpm db:deploy            # run migrations
pnpm db:seed              # 32 profiles, 7 of them already liked you
pnpm dev                  # http://localhost:4000

# frontend (new terminal)
cd frontend
pnpm install
pnpm dev                  # http://localhost:3000/discover
```

Use the browser's mobile view to try dragging. On desktop the buttons and arrow keys work too.
Once you run out of profiles there's a "Start over" button that clears your swipes for another demo.

Profiles that already liked you (so you can test a match): Ananya, Kabir, Sana, Aditya, Neel,
Pooja, Zoya.

## API

Base path `/api/v1`. There's no auth, every request is treated as the seeded user
(`CURRENT_USER_ID` in `.env`).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/feed?limit=10` | Profiles you haven't swiped on yet. Returns `{ profiles, hasMore }` |
| POST | `/swipe` | Body `{ targetId, direction: "like" or "pass" }`. Returns `{ matched: false }` or `{ matched: true, match }` |
| GET | `/matches` | Mutual matches, newest first |
| POST | `/demo/reset` | Deletes your own swipes and matches (only when `DEMO_RESET_ENABLED=true`) |
| GET | `/health/live`, `/health/ready` | Health checks |

Responses look like `{ success, message, data }`. Errors look like
`{ success: false, message, code, correlationId }`.

Some rules on `/swipe`:

- you can't change a swipe once it's made (409)
- sending the exact same swipe again just returns the same result (safe for retries)
- swiping on yourself gives 400, an unknown profile gives 404

`backend/http/api.http` has sample requests.

## Keeping likes private

The main requirement was that nobody should be able to tell who liked them unless it's mutual.
How I handled it:

- **Feed doesn't look at other people's swipes at all.** It only filters out profiles you already
  swiped. I didn't put likers first in the feed (some apps do this to get faster matches) because
  then the order would give it away. The order is an md5 of your id + their id, so it's stable for
  you but has nothing to do with likes. There's a test that checks the feed is exactly the same
  before and after other users like or pass on you.
- **Swipe response is the same for pass and one-sided like.** Both return `{ matched: false }`,
  also covered by a test.
- **Profiles are always mapped through one function** (`toPublicProfile`) that only copies the
  public fields, so swipe data can't end up in a response by accident.
- **Matches only show mutual likes.** One-sided likes in either direction never show up.
- User ids are random UUID v4 (v7 would leak signup time), and API responses are sent with
  `Cache-Control: no-store`.
- The demo reset could be used to undo likes, so it's off by default and the server refuses to
  start with it enabled in production.

## Race condition on matches

If two people like each other at the exact same time, both requests can miss the other's like
(neither is committed yet) and the match never gets created. To fix this, the swipe runs in a
transaction that first takes a Postgres advisory lock on the pair, so swipes between the same
two users run one at a time.

There's a test that sends 10 mutual likes at the same time and expects 10 matches. Without the
lock it fails (I got 1-4 matches when I tried).

The database also has constraints for this: unique (swiper, target), no swiping yourself, and
matches stored as (smaller id, bigger id) so a pair can't have two rows.

## Backend structure

Layered: routes -> controllers -> services -> repositories. Only repositories talk to Prisma.

```
backend/src
  app.ts, server.ts
  config/          env validation (zod), prisma client, logger
  routes/v1/       express routers
  controllers/     request/response handling
  services/        business logic (matching, feed)
  repositories/    database queries
  validators/      zod schemas for request input
  mappers/         db rows -> API response shapes
  middlewares/     correlation id, request logging, validation, errors, current user
  utils/
```

## Frontend notes

- The swiped card is removed from the deck right away and the request is sent in the background.
  A separate "flying" copy of the card does the exit animation, so you can keep swiping quickly.
- If saving a swipe fails, the card comes back on top with an error message.
- Deck state is a reducer in `src/lib/deck.ts` (unit tested). It remembers what you swiped this
  session so an older feed response can't show the same card again.
- Next page of profiles is fetched when 3 cards are left.

## Tests and checks

```bash
cd backend && pnpm lint && pnpm typecheck && pnpm test    # needs the docker postgres running
cd frontend && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

GitHub Actions runs the same checks (`.github/workflows/ci.yml`).

## Things I'd add next

- Real auth (only `currentUser.middleware.ts` would need to change)
- Rate limiting on `/swipe`
- Pagination for matches
- Filters (age, distance), unmatch/report, photo uploads
