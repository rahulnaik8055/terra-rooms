# Terra Rooms

A multi-party property due diligence workspace. Buyers, sellers, banks, lawyers, and brokers collaborate in real-time — each role sees only the data they need.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via [Prisma 7](https://prisma.io/) + BetterSQLite3
- **Real-time**: Socket.IO (WebSocket)
- **Auth**: JWT (httpOnly cookies), Edge proxy middleware
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js custom server (CommonJS)

## Architecture

```
client (Next.js) ──http──> Next.js API routes ──> Prisma ──> SQLite
                  ──ws──> Socket.IO server (custom) ──> better-sqlite3
```

The Edge proxy validates JWT tokens and injects user identity as request headers for API routes. The Socket.IO server runs on the same HTTP server, authenticates via JWT, and auto-joins users to their rooms.

## Getting Started

```bash
# Clone the repository
git clone <repo-url> && cd terra-rooms

# Install dependencies
npm install

# Set up environment
echo "JWT_SECRET=your-secret-here" > .env.local

# Run database migrations and seed
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Reset Database

```bash
npm run reset
```

This drops the database, re-applies migrations, and re-seeds.

## Production Build

```bash
npm run build
npm start
```

## Demo Credentials

All users share the same password: `password123`

| Role   | Email              | Can Create Rooms | Can Advance Status         | Can View Sections                       |
|--------|--------------------|------------------|----------------------------|-----------------------------------------|
| Buyer  | buyer@test.com     | Yes              | —                          | Overview only                           |
| Seller | seller@test.com    | No               | —                          | Overview only                           |
| Bank   | bank@test.com      | No               | BANK_APPROVED              | Encumbrance, Tax Records                |
| Lawyer | lawyer@test.com    | No               | LAWYER_VERIFIED            | Ownership History, Title Chain, Encumbrance |
| Broker | broker@test.com    | No               | IN_REVIEW, CLOSED          | Overview only                           |

Click any role button on the login page for instant access.

## Features

### Role-Based Access Control (RBAC)

Each participant in a room has a role that determines:

- **Property data visibility**: Sensitive sections (ownership history, encumbrance, tax records, title chain) are only visible to authorised roles. Hidden sections display a "Restricted" placeholder.
- **Status workflow permissions**: Only specific roles can advance the room status (e.g., only a Lawyer can set `LAWYER_VERIFIED`).

### Status Workflow

Rooms progress through a linear status flow:

```
DRAFT → IN_REVIEW → LAWYER_VERIFIED → BANK_APPROVED → CLOSED
```

- Each transition is validated server-side against both the flow order and the user's role.
- Every status change is recorded as an activity log entry.
- The UI stepper shows completed, current, and pending steps with animations.

### Real-Time Collaboration

- **Socket.IO** with automatic room join on connection.
- New activities are broadcast instantly to all room participants.
- Status changes update the UI in real time without page refresh.
- Connected indicator and auto-reconnection.

### Activity Log

Every action in a room (status changes, notes, document uploads) is recorded with the user's identity and timestamp. Participants can add free-form notes that are persisted and broadcast in real time.

### Security

- JWT stored in httpOnly cookies (not accessible to JavaScript).
- Edge proxy middleware validates JWT on protected routes before they reach the API handler.
- Socket.IO connections are authenticated with the same JWT.
- Property data is filtered on the server — the client never receives data it shouldn't see.

## Project Structure

```
prisma/
  schema.prisma          # Data model (User, Property, Room, Participant, ActivityLog)
  seed.ts                # Database seed script

src/
  app/
    page.tsx             # Landing page
    login/               # Authentication
    register/            # User registration
    dashboard/           # Room list
    rooms/
      [id]/              # Room detail workspace
      create/            # Room creation (Buyer only)
    api/
      auth/              # Login, register, logout, session
      rooms/             # CRUD + status + activity
      properties/        # Property listing + detail
      users/             # User lookup by email

  providers/
    AuthProvider.tsx     # Auth context wrapper
    SocketProvider.tsx   # Socket.IO client provider

  hooks/
    useAuth.ts           # Auth hook (login, register, logout, session)
    useSocket.ts         # Socket context consumer

  lib/
    prisma.ts            # Prisma client singleton
    auth.ts              # JWT sign/verify
    password.ts          # bcrypt hash/compare
    permissions.ts       # RBAC rules, sanitisation, status flow
    api.ts               # Request auth helpers

server.js                # Custom Node.js server (Next.js + Socket.IO)
```

## License

MIT
