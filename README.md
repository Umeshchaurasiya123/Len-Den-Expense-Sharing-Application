# Len-Den --- Expense Sharing Application

> A group expense management application to track shared expenses, split
> bills, manage balances, and settle debts.

**Repository:** `len-den`\
**Project type:** Backend-first MVP\
**Initial scope:** Backend APIs only. Frontend design and implementation
will come later.

------------------------------------------------------------------------

## 1. Project overview

Len-Den is a Splitwise-like expense-sharing application. Users can
create groups, invite members, record shared expenses, split costs, see
who owes whom, and record settlements.

The first version should include the essential functionality without
becoming overloaded with features.

### MVP features

-   User signup, login, logout, and profile management.
-   JWT-based, token-based authentication (not traditional server-side
    sessions).
-   Access-token and refresh-token handling.
-   Group creation, viewing, editing, and deletion.
-   Group invitations and member joining.
-   Add, remove, and list group members.
-   Add, edit, delete, and view expenses.
-   Equal and custom-amount expense splits.
-   Group and individual balance calculations.
-   Record, edit, delete, and view settlements.
-   Simplify debts and suggest a smaller set of payments.
-   Authorization checks so users can only access data they are allowed
    to access.

### Out of scope for the first version

-   Online payment processing.
-   Bank-account integration.
-   Multi-currency conversion.
-   Recurring expenses.
-   Push notifications.
-   Chat and social features.
-   Advanced analytics and reports.

These can be considered after the core application works reliably.

------------------------------------------------------------------------

## 2. Technology stack

Use JavaScript initially. TypeScript can be introduced later.

  -----------------------------------------------------------------------
  Area                    Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Runtime                 Node.js                 Run JavaScript on the
                                                  server

  Backend framework       Express.js              HTTP server and REST
                                                  APIs

  Language                JavaScript              Backend implementation

  Database                PostgreSQL              Relational data storage

  ORM                     Prisma                  Query PostgreSQL from
                                                  JavaScript

  Authentication          JWT                     Access-token
                                                  authentication

  Password hashing        bcryptjs                Store password hashes

  Validation              Zod                     Validate request data

  Security headers        Helmet                  Set safer HTTP headers

  Rate limiting           express-rate-limit      Limit repeated requests

  Logging                 Morgan                  HTTP request logging

  API testing             Postman                 Test endpoints

  Version control         Git and GitHub          Source-code management

  Database hosting        Neon or another managed Production database
                          PostgreSQL provider     

  Backend hosting         To be selected later    Deploy the API
  -----------------------------------------------------------------------

### Why PostgreSQL instead of MongoDB?

This application has naturally related data:

-   Users belong to groups.
-   Groups contain members.
-   Expenses belong to groups.
-   Expenses contain individual splits.
-   Settlements connect two users within a group.

PostgreSQL is a strong fit for these relationships, relational
constraints, transactions, and reporting.

### Why Prisma?

Prisma is an ORM (Object Relational Mapper). It lets JavaScript code
work with database records through a generated client while still
allowing SQL to be used when needed.

Prisma does not replace SQL knowledge. Learn tables, primary keys,
foreign keys, joins, indexes, constraints, and transactions.

------------------------------------------------------------------------

## 3. High-level architecture

The backend will expose REST APIs that return and accept JSON.

``` text
Web application (later) ─────┐
                             │
Mobile application (later) ──┼──> Express REST API
                             │          │
Postman (during development) ┘          │
                                        v
                                  Prisma ORM
                                        │
                                        v
                                  PostgreSQL
```

For the first phase, only the backend and database are in scope. The
frontend does not need to be designed before backend development begins.

A future web application can use React or Next.js. A future mobile
application can use React Native with Expo. Both can consume the same
backend APIs.

------------------------------------------------------------------------

## 4. Database design

Use UUID primary keys and store monetary values as integer paise to
avoid floating-point rounding errors.

Examples:

-   ₹100.00 = `10000` paise
-   ₹1,250.50 = `125050` paise

### Core tables

  Table              Purpose
  ------------------ ----------------------------------------------------
  `users`            User accounts and password hashes
  `refresh_tokens`   Hashed refresh tokens, expiry, and revocation
  `groups`           Expense groups
  `group_members`    Many-to-many relationship between users and groups
  `group_invites`    Invitation tokens and their status
  `expenses`         Main expense records
  `expense_splits`   Each participant's share of an expense
  `settlements`      Payments made between group members

### Relationships

``` mermaid
erDiagram
    USERS ||--o{ GROUPS : creates
    USERS ||--o{ GROUP_MEMBERS : joins
    GROUPS ||--o{ GROUP_MEMBERS : contains
    GROUPS ||--o{ GROUP_INVITES : has
    USERS ||--o{ REFRESH_TOKENS : owns
    GROUPS ||--o{ EXPENSES : contains
    USERS ||--o{ EXPENSES : pays
    EXPENSES ||--|{ EXPENSE_SPLITS : contains
    USERS ||--o{ EXPENSE_SPLITS : owes
    GROUPS ||--o{ SETTLEMENTS : contains
    USERS ||--o{ SETTLEMENTS : pays
    USERS ||--o{ SETTLEMENTS : receives
```

### Table details

#### `users`

  Column            Suggested type   Notes
  ----------------- ---------------- -----------------------------------
  `id`              UUID             Primary key
  `name`            VARCHAR          User's display name
  `email`           VARCHAR          Unique, normalized email
  `password_hash`   VARCHAR          Never store a plain-text password
  `created_at`      TIMESTAMP        Creation time
  `updated_at`      TIMESTAMP        Last update

#### `refresh_tokens`

  Column         Suggested type        Notes
  -------------- --------------------- ---------------------------------
  `id`           UUID                  Primary key
  `user_id`      UUID                  Foreign key to users
  `token_hash`   VARCHAR               Store a hash, not the raw token
  `expires_at`   TIMESTAMP             Expiration
  `revoked_at`   TIMESTAMP, nullable   Revocation time
  `created_at`   TIMESTAMP             Creation time

#### `groups`

  Column            Suggested type        Notes
  ----------------- --------------------- ----------------------------
  `id`              UUID                  Primary key
  `name`            VARCHAR               Group name
  `description`     TEXT, nullable        Optional description
  `currency`        VARCHAR               Default `INR`
  `created_by_id`   UUID                  User who created the group
  `deleted_at`      TIMESTAMP, nullable   Soft deletion
  `created_at`      TIMESTAMP             Creation time
  `updated_at`      TIMESTAMP             Last update

#### `group_members`

  Column        Suggested type   Notes
  ------------- ---------------- -----------------------
  `id`          UUID             Primary key
  `group_id`    UUID             Foreign key to groups
  `user_id`     UUID             Foreign key to users
  `role`        ENUM             `ADMIN` or `MEMBER`
  `joined_at`   TIMESTAMP        Membership time

Add a unique constraint on `(group_id, user_id)` so the same user cannot
join a group twice.

#### `group_invites`

  Column            Suggested type        Notes
  ----------------- --------------------- ----------------------------------
  `id`              UUID                  Primary key
  `group_id`        UUID                  Group being joined
  `created_by_id`   UUID                  User who created invitation
  `token_hash`      VARCHAR               Store a hash of the invite token
  `expires_at`      TIMESTAMP             Invitation expiry
  `accepted_at`     TIMESTAMP, nullable   Acceptance time
  `created_at`      TIMESTAMP             Creation time

#### `expenses`

  Column            Suggested type        Notes
  ----------------- --------------------- -------------------------------
  `id`              UUID                  Primary key
  `group_id`        UUID                  Group
  `paid_by_id`      UUID                  User who paid
  `created_by_id`   UUID                  User who recorded the expense
  `description`     VARCHAR               Expense description
  `amount_paise`    BIGINT                Total amount in paise
  `split_type`      ENUM                  `EQUAL` or `CUSTOM`
  `deleted_at`      TIMESTAMP, nullable   Soft deletion
  `created_at`      TIMESTAMP             Creation time
  `updated_at`      TIMESTAMP             Last update

#### `expense_splits`

  Column           Suggested type   Notes
  ---------------- ---------------- ---------------------------------
  `id`             UUID             Primary key
  `expense_id`     UUID             Foreign key to expenses
  `user_id`        UUID             Participant whose share this is
  `amount_paise`   BIGINT           Participant's share in paise

Add a unique constraint on `(expense_id, user_id)` if each participant
has one aggregated split row per expense.

#### `settlements`

  Column           Suggested type   Notes
  ---------------- ---------------- ---------------------
  `id`             UUID             Primary key
  `group_id`       UUID             Group
  `paid_by_id`     UUID             Person who paid
  `paid_to_id`     UUID             Person who received
  `amount_paise`   BIGINT           Amount in paise
  `note`           TEXT, nullable   Optional note
  `created_at`     TIMESTAMP        Payment record time

For settlement editing and deletion, retain enough history for
auditability. A later version can introduce an explicit audit/event
table.

------------------------------------------------------------------------

## 5. Expense and balance calculation

For every user in a group:

``` text
Net balance = Total amount paid - Total amount owed
```

-   Positive balance: the user should receive money.
-   Negative balance: the user owes money.
-   Zero balance: the user is settled.

### Example

Four friends share a ₹1,000 expense equally. Umesh pays the full amount.

  Person       Paid   Share   Net balance
  -------- -------- ------- -------------
  Umesh      ₹1,000    ₹250         +₹750
  Rahul          ₹0    ₹250         -₹250
  Amit           ₹0    ₹250         -₹250
  Priya          ₹0    ₹250         -₹250

Suggested payments:

-   Rahul pays Umesh ₹250.
-   Amit pays Umesh ₹250.
-   Priya pays Umesh ₹250.

### Debt simplification

Debt simplification should calculate suggested payments from the net
balances. It must not rewrite or delete original expenses and
settlements.

Example:

-   Rahul owes Umesh ₹500.
-   Umesh owes Amit ₹300.
-   Amit owes Rahul ₹200.

Net balances:

  Person     Net balance
  -------- -------------
  Rahul            -₹300
  Umesh            +₹200
  Amit             +₹100

Simplified suggestions:

-   Rahul pays Umesh ₹200.
-   Rahul pays Amit ₹100.

Implement this logic in a separate balance service. Test it with
multiple scenarios, including rounding and zero balances.

### Important money rules

-   Use integer paise, not JavaScript floating-point arithmetic, for
    money calculations.
-   Ensure all expense split amounts sum exactly to the expense total.
-   For equal splits, distribute any remainder paise deterministically.
-   Validate that amounts are positive.
-   Prevent a user from settling with themselves.
-   Prevent settlements that exceed the outstanding amount, unless the
    product explicitly supports advance payments.
-   Use database transactions when writing an expense and its splits.
-   Recalculate balances from the source records rather than storing a
    potentially stale balance.

------------------------------------------------------------------------

## 6. REST API design

Base path:

``` text
/api/v1
```

### Authentication

  Method   Endpoint          Purpose
  -------- ----------------- ----------------------
  POST     `/auth/signup`    Register
  POST     `/auth/login`     Login
  POST     `/auth/refresh`   Refresh tokens
  POST     `/auth/logout`    Revoke refresh token
  GET      `/users/me`       Get current profile
  PATCH    `/users/me`       Update profile

### Groups and membership

  Method   Endpoint                        Purpose
  -------- ------------------------------- ----------------------------
  POST     `/groups`                       Create group
  GET      `/groups`                       List current user's groups
  GET      `/groups/:id`                   Get group details
  PATCH    `/groups/:id`                   Update group
  DELETE   `/groups/:id`                   Delete/archive group
  GET      `/groups/:id/members`           List members
  DELETE   `/groups/:id/members/:userId`   Remove member
  POST     `/groups/:id/invites`           Create invite
  POST     `/invites/:token/join`          Accept invite

### Expenses

  Method   Endpoint                 Purpose
  -------- ------------------------ ------------------------
  POST     `/groups/:id/expenses`   Add expense
  GET      `/groups/:id/expenses`   List expenses
  GET      `/expenses/:id`          Get expense
  PATCH    `/expenses/:id`          Edit expense
  DELETE   `/expenses/:id`          Delete/archive expense

### Settlements

  Method   Endpoint                    Purpose
  -------- --------------------------- ---------------------------
  POST     `/groups/:id/settlements`   Record settlement
  GET      `/groups/:id/settlements`   List settlements
  PATCH    `/settlements/:id`          Edit settlement
  DELETE   `/settlements/:id`          Delete/reverse settlement

### Balances

  Method   Endpoint                         Purpose
  -------- -------------------------------- -------------------------------
  GET      `/groups/:id/balances`           Group member balances
  GET      `/groups/:id/simplified-debts`   Suggested simplified payments
  GET      `/users/me/balances`             Current user's balances

Use consistent JSON response formats and appropriate HTTP status codes.
Validate request bodies and path parameters.

------------------------------------------------------------------------

## 7. Backend folder structure

Use a modular structure so each feature has its own routes, controller,
service, and validation.

``` text
len-den/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   └── user.service.js
│   │   │
│   │   ├── groups/
│   │   │   ├── group.routes.js
│   │   │   ├── group.controller.js
│   │   │   ├── group.service.js
│   │   │   └── member.service.js
│   │   │
│   │   ├── expenses/
│   │   │   ├── expense.routes.js
│   │   │   ├── expense.controller.js
│   │   │   ├── expense.service.js
│   │   │   └── expense.validation.js
│   │   │
│   │   ├── settlements/
│   │   │   ├── settlement.routes.js
│   │   │   ├── settlement.controller.js
│   │   │   └── settlement.service.js
│   │   │
│   │   └── balances/
│   │       └── balance.service.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── error-handler.js
│   │   └── not-found.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── api-response.js
│   │
│   ├── app.js
│   └── server.js
│
├── prisma/
│   └── schema.prisma
├── tests/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Request flow

For example, when a user creates an expense:

1.  Route receives `POST /groups/:id/expenses`.
2.  Authentication middleware verifies the access token.
3.  Validation checks the request body.
4.  Controller handles the HTTP request and response.
5.  Service checks membership and business rules.
6.  Prisma writes the expense and splits in a database transaction.
7.  Controller returns the response.

Keep business logic in services rather than placing it directly in route
handlers.

------------------------------------------------------------------------

## 8. Authentication design

Use JWT access tokens and rotating refresh tokens.

Suggested initial expiry:

  Token           Lifetime     Storage
  --------------- ------------ ----------------------------------------
  Access token    15 minutes   Client memory where practical
  Refresh token   7 days       Hashed in database; delivered securely

### Login flow

1.  User submits email and password.
2.  Backend finds the user and verifies the password hash.
3.  Backend creates a signed access JWT.
4.  Backend generates a cryptographically random refresh token.
5.  Backend stores only the refresh-token hash.
6.  Backend returns the access token and delivers the refresh token
    securely.
7.  Client sends the access token in the `Authorization: Bearer ...`
    header.

### Refresh flow

1.  Client sends its refresh token to `/auth/refresh`.
2.  Backend hashes and checks it against the stored token.
3.  Backend checks expiry and revocation.
4.  Backend revokes the old token and issues a new token pair.
5.  Reuse of an already-rotated token should trigger appropriate
    token-family revocation and security handling.

### Logout flow

Revoke the refresh token. Access tokens are short-lived, so they expire
naturally. If immediate access-token revocation is required, introduce a
token denylist or another revocation mechanism.

### Client storage

-   Web: prefer an HttpOnly, Secure, SameSite cookie for the refresh
    token, with appropriate CSRF protection.
-   Mobile: use secure device storage.
-   Never put signing secrets or database credentials in frontend code.

------------------------------------------------------------------------

## 9. Important authorization and business rules

-   Only authenticated users can access protected APIs.
-   Only group members can view that group's data.
-   Only authorized group admins can perform admin operations.
-   Only authorized users can edit or delete an expense.
-   Only valid group members can be expense participants.
-   A removed member cannot access the group going forward.
-   Do not remove members with outstanding balances without a deliberate
    resolution process.
-   Do not delete groups with unresolved balances.
-   Expense edits and deletions must correctly change calculated
    balances.
-   Settlements must reference valid members of the same group.
-   Simplified debt suggestions must not change financial source
    records.
-   Use database transactions for related writes.
-   Prefer archival/soft deletion for financial records so history is
    not silently lost.

For an MVP, define a clear rule for who can edit an expense: its
creator, the group admin, or both. Enforce the same rule consistently.

------------------------------------------------------------------------

## 10. Initial project setup

Install a current Node.js LTS release, Git, VS Code, and Postman.

Create the project:

``` bash
mkdir len-den
cd len-den
npm init -y
```

Install runtime dependencies:

``` bash
npm install express dotenv cors helmet cookie-parser bcryptjs jsonwebtoken zod express-rate-limit morgan @prisma/client
```

Install development dependencies:

``` bash
npm install -D prisma nodemon
```

Initialize Prisma:

``` bash
npx prisma init
```

Create the initial directories:

``` bash
mkdir src
mkdir src/config
mkdir src/modules
mkdir src/middleware
mkdir src/utils
mkdir tests
```

Create module directories and files using VS Code Explorer.

### Package scripts

Add scripts to `package.json` (preserve the other generated fields):

``` json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "node --test"
  }
}
```

Choose one JavaScript module system and use it consistently. ES Modules
(`import`/`export`) are a good modern default; CommonJS
(`require`/`module.exports`) is also valid. Do not mix them
accidentally.

### Environment variables

Example `.env.example`:

``` env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE"

JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
```

Use a separate local `.env` file containing real values. Never commit
`.env` to GitHub.

Example `.gitignore`:

``` gitignore
node_modules/
.env
.env.*
!.env.example
coverage/
.DS_Store
```

### Database setup

For development, either:

-   Install PostgreSQL locally, or
-   Create a development database with a managed PostgreSQL provider
    such as Neon.

For production, use a separate production database. Never point
production at a database running on your personal laptop.

Use Prisma migrations to manage schema changes. Review the Prisma
version and generated configuration before applying setup commands;
Prisma's configuration differs between major versions.

------------------------------------------------------------------------

## 11. Local development versus production deployment

Maintain separate environments.

  -----------------------------------------------------------------------
  Environment             Application             Database
  ----------------------- ----------------------- -----------------------
  Development             Runs on your laptop     Local PostgreSQL or
                                                  development cloud
                                                  database

  Production              Hosted backend          Separate production
                                                  PostgreSQL database
  -----------------------------------------------------------------------

The application reads its database connection from `DATABASE_URL`. The
local and production environments use different values.

### Possible deployment setup

-   Backend: Render, Railway, AWS, or another Node.js hosting provider.
-   Database: Neon, Supabase, or Amazon RDS for PostgreSQL.
-   Source code: GitHub.
-   Environment secrets: configured in the hosting provider's dashboard.
-   Domain and HTTPS: configure when needed.

Vercel is particularly convenient for Next.js web applications. A
long-running Express API can be deployed on a suitable Node.js hosting
service. Next.js can also host server-side API functionality, but this
project will initially keep its Express backend separate.

### Do we need Docker?

Not initially.

Docker is useful for packaging an application and its runtime
dependencies into a consistent container. Learn it after the backend
works locally and you understand deployment basics.

------------------------------------------------------------------------

## 12. Development roadmap

Build and test one module at a time.

### Phase 1 --- Project initialization

-   [ ] Create GitHub repository.
-   [ ] Initialize Node.js project.
-   [ ] Install Express and dependencies.
-   [ ] Configure environment variables.
-   [ ] Configure PostgreSQL.
-   [ ] Configure Prisma.
-   [ ] Create first database migration.
-   [ ] Create Express app and server entry point.
-   [ ] Add health-check endpoint.

### Phase 2 --- Authentication

-   [ ] Signup.
-   [ ] Password hashing.
-   [ ] Login.
-   [ ] Access JWT.
-   [ ] Refresh-token generation and rotation.
-   [ ] Logout and revocation.
-   [ ] Authentication middleware.
-   [ ] Current-user profile.
-   [ ] Test protected endpoints.

### Phase 3 --- Groups

-   [ ] Create group.
-   [ ] List groups.
-   [ ] Get group details.
-   [ ] Update group.
-   [ ] Archive/delete group.
-   [ ] Create invitation.
-   [ ] Join group.
-   [ ] List members.
-   [ ] Remove member with balance checks.

### Phase 4 --- Expenses

-   [ ] Add expense.
-   [ ] Equal split.
-   [ ] Custom-amount split.
-   [ ] Validate split totals.
-   [ ] List and view expenses.
-   [ ] Edit expense.
-   [ ] Delete/archive expense.
-   [ ] Test transaction rollback and balance changes.

### Phase 5 --- Balances and debt simplification

-   [ ] Calculate group balances.
-   [ ] Calculate user balances.
-   [ ] Implement simplified debt suggestions.
-   [ ] Test multiple expense and settlement combinations.
-   [ ] Test paise-level rounding.

### Phase 6 --- Settlements

-   [ ] Record settlement.
-   [ ] View settlement history.
-   [ ] Edit settlement.
-   [ ] Delete/reverse settlement.
-   [ ] Recalculate balances.

### Phase 7 --- Final testing and deployment

-   [ ] Unit tests for services.
-   [ ] API integration tests.
-   [ ] Authorization tests.
-   [ ] Error handling.
-   [ ] Rate limiting and security review.
-   [ ] Production environment configuration.
-   [ ] Database migrations.
-   [ ] Backup and recovery plan.
-   [ ] Deploy backend.

------------------------------------------------------------------------

## 13. Testing strategy

Use Postman while developing the backend.

Create a collection with folders:

``` text
Len-Den API
├── Authentication
├── Users
├── Groups
├── Group Members
├── Expenses
├── Balances
└── Settlements
```

Test both successful and unsuccessful cases.

Examples:

-   Signup with a valid email.
-   Signup with an existing email.
-   Login with an incorrect password.
-   Access a protected endpoint without a token.
-   Access another user's group.
-   Add an expense with splits that do not sum to the total.
-   Remove a member who still has an outstanding balance.
-   Settle more than the outstanding amount.
-   Edit an expense and verify that balances change correctly.

Use automated tests for the balance-calculation service because
financial calculations are central to the application.

------------------------------------------------------------------------

## 14. Initial milestones

The first working milestone should be small:

**Milestone 1: A running Express server connected to PostgreSQL.**

Acceptance criteria:

-   Project starts with `npm run dev`.
-   Server listens on the configured port.
-   `/api/v1/health` returns a successful JSON response.
-   Prisma can connect to PostgreSQL.
-   A database migration can be applied.
-   `.env` is excluded from Git.

Then proceed to authentication.

**Do not start the frontend yet.** First make the backend APIs reliable
and testable with Postman.

------------------------------------------------------------------------

## 15. Project conventions

-   Use meaningful names for files, functions, variables, and API
    routes.
-   Keep controllers thin and business logic in services.
-   Validate all external input.
-   Never trust a user ID supplied by the client when the authenticated
    identity is available in the token.
-   Use parameterized database operations through Prisma or safe SQL.
-   Use transactions for related database writes.
-   Store money as integer paise.
-   Keep secrets out of source control.
-   Add tests for important business rules.
-   Document API request and response examples as the project grows.

------------------------------------------------------------------------

## 16. Future enhancements

After the MVP is stable, consider:

-   React/Next.js web frontend.
-   React Native mobile app.
-   Email invitations.
-   Notifications.
-   Recurring expenses.
-   Multiple currencies.
-   Export to CSV or PDF.
-   Expense categories and analytics.
-   Audit history.
-   Docker and AWS deployment.

------------------------------------------------------------------------

## 17. Useful official documentation

-   Node.js: https://nodejs.org/
-   Express: https://expressjs.com/
-   PostgreSQL: https://www.postgresql.org/docs/
-   Prisma: https://www.prisma.io/docs
-   Neon: https://neon.com/docs
-   JSON Web Tokens: https://jwt.io/introduction
-   Postman: https://learning.postman.com/
-   Git: https://git-scm.com/doc

------------------------------------------------------------------------

## Current project status

-   [x] Product idea and MVP scope defined.
-   [x] Initial technology stack selected.
-   [x] Database entities and relationships planned.
-   [x] REST API routes outlined.
-   [x] Backend folder structure planned.
-   [ ] Create GitHub repository.
-   [ ] Initialize local project.
-   [ ] Connect PostgreSQL.
-   [ ] Implement authentication.
-   [ ] Implement groups, expenses, balances, and settlements.
-   [ ] Test and deploy backend.
-   [ ] Design and build frontend later.

**Next development task:** Complete Phase 1 --- project initialization
and PostgreSQL connectivity.
