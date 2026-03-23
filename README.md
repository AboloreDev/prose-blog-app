# prose-blog-app
# Prose — Reddit-inspired Blog App

A production-grade REST API built in Go for a Reddit-inspired blogging platform. Features a full authentication system, community-based posting, nested comments, voting, and scheduled post publishing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Go |
| HTTP | net/http (standard library) |
| Database | SQLite with WAL mode |
| Auth | JWT + SHA256 hashed refresh tokens |
| Rate Limiting | Token bucket (golang.org/x/time/rate) |
| Pattern | Repository pattern with interfaces |

---

## Features

**Authentication**
- JWT access tokens (HS256, 15 min expiry)
- Refresh tokens — 32 random bytes via crypto/rand, SHA256 hashed before storage
- httpOnly cookie for refresh token storage
- Token revocation on logout, logout from all devices
- Background token cleanup every hour via time.Ticker
- Per-IP token bucket rate limiting

**Posts**
- Create, read, update, delete posts
- Draft and scheduled post support
- Publish scheduled posts via time.NewTimer
- Search, sort and pagination on all list endpoints
- Vote count and comment count aggregated per post

**Comments**
- Nested comments via parent_id
- Top level comments and replies fetched separately
- Self JOIN to count replies per comment
- Vote count aggregated per comment

**Votes**
- Upvote and downvote posts and comments
- Composite primary key prevents duplicate votes at DB level
- Separate tables for post votes and comment votes

**Communities**
- Create and manage communities
- Join and leave communities
- Member roles (member, moderator)
- Search and pagination on community listing

**Followers**
- Follow and unfollow users
- Get followers and following lists
- IsFollowing check returns boolean
- Follower and following count in single DB round trip via subqueries

---

## Architecture
```
prose-api/
├── auth/
│   ├── auth_repository.go   → refresh token DB operations
│   ├── jwt.go               → JWT generation and validation
│   └── auth_model.go        → RefreshToken struct
├── users/
│   ├── user_repository.go   → user DB operations
│   └── user_model.go        → User, Profile structs
├── posts/
│   ├── post_repository.go   → post DB operations with dynamic queries
│   └── post_model.go        → Post, PostDetails, Filter, MetaData structs
├── comments/
│   ├── comment_repository.go → comment DB operations
│   └── comment_model.go     → Comment struct
├── votes/
│   ├── vote_repository.go   → post and comment vote operations
│   └── vote_model.go        → PostVotes, CommentVotes structs
├── community/
│   ├── community_repository.go → community DB operations
│   └── community_model.go   → Community, CommunityMember structs
├── followers/
│   ├── follower_repository.go → follow/unfollow operations
│   └── follower_model.go    → Followers, FollowCount structs
├── middleware/
│   ├── auth.go              → JWT auth middleware
│   ├── cors.go              → CORS middleware
│   ├── ratelimit.go         → token bucket rate limit middleware
│   ├── logger.go            → request logger middleware
│   └── recover.go           → panic recovery middleware
├── ratelimit/
│   └── ratelimit.go         → IPLimiter with sync.Mutex
├── helpers/
│   └── helpers.go           → writeJSON, readJSON
└── cmd/
    ├── main.go              → Application struct, startup
    ├── server.go            → HTTP server
    └── routes.go            → route definitions
```

---

## Key Technical Decisions

**Token bucket rate limiting**
Each IP gets its own limiter stored in a map protected by sync.Mutex. 20 token burst capacity refilling at 10 per second. Allows natural traffic bursts without punishing normal users.

**SHA256 token hashing**
Refresh tokens are never stored raw. SHA256 hash stored in DB — if the database is compromised, tokens are useless to an attacker.

**Composite primary keys on votes**
```sql
PRIMARY KEY (user_id, post_id)
```
SQLite enforces one vote per user per post at the storage layer. No application logic needed.

**Dynamic query building**
List endpoints build SQL conditionally based on filter parameters — search, sort order and pagination appended as strings with arguments collected in a slice. One function handles all combinations.

**Nested comments via parent_id**
Top level comments have parent_id = NULL. Replies store the parent comment ID. Reply count is fetched via a self JOIN — the comments table joins itself using an alias.

**Middleware chain order**
```
CORS → RateLimit → Logger → Recover
```
CORS runs first so browser preflight requests don't consume rate limit tokens. Recover is outermost so it catches panics from every layer.

**Background cleanup with time.Ticker**
A goroutine starts on server boot. time.Ticker fires every hour to purge expired refresh tokens from the database. A stop channel ensures clean shutdown with no goroutine leaks.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh access token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get all posts |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| GET | `/api/posts/drafts` | Get user drafts |
| GET | `/api/posts/scheduled` | Get scheduled posts |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts/:id/comments` | Create comment |
| GET | `/api/posts/:id/comments` | Get post comments |
| GET | `/api/comments/:id/replies` | Get nested replies |
| PUT | `/api/comments/:id` | Update comment |
| DELETE | `/api/comments/:id` | Delete comment |

### Votes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts/:id/vote` | Vote on post |
| DELETE | `/api/posts/:id/vote` | Remove post vote |
| POST | `/api/comments/:id/vote` | Vote on comment |
| DELETE | `/api/comments/:id/vote` | Remove comment vote |

### Communities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/communities` | Get all communities |
| GET | `/api/communities/:slug` | Get community |
| POST | `/api/communities` | Create community |
| PUT | `/api/communities/:id` | Update community |
| DELETE | `/api/communities/:id` | Delete community |
| POST | `/api/communities/:id/join` | Join community |
| DELETE | `/api/communities/:id/leave` | Leave community |

### Followers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/:id/follow` | Follow user |
| DELETE | `/api/users/:id/follow` | Unfollow user |
| GET | `/api/users/:id/followers` | Get followers |
| GET | `/api/users/:id/following` | Get following |

---

## Getting Started
```bash
# Clone the repo
git clone https://github.com/AboloreDev/prose-api.git
cd prose-blog-app

# Install dependencies
go mod download

# Set environment variables
cp .env.example .env
# Add JWT_SECRET to .env

# Run the server
go run ./server

# Server starts on http://localhost:4040
# Database created and migrated automatically on first run
```

> Requires GCC for go-sqlite3 CGO compilation

---

## Environment Variables
```
JWT_SECRET=your_secret_key
PORT=6000
```

---

Built by [Alabi Fathiu](https://github.com/AboloreDev)
