# Authentication Flow

## Overview

Temar uses [better-auth](https://www.better-auth.com/) with a Drizzle adapter for authentication. The auth system lives entirely within the Next.js web app -- backend microservices have no session awareness and authenticate callers via `x-api-key` headers.

**Providers:** Email/password signup, Google OAuth
**Session storage:** PostgreSQL via Drizzle (`session` table)
**Guard components:** `RedirectToSignIn` + `SignedIn` from `@daveyplate/better-auth-ui`

### Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/auth.ts` | `betterAuth()` config: Drizzle adapter, providers, UUID generation |
| `apps/web/src/lib/auth-client.ts` | Client-side `createAuthClient()` helper |
| `apps/web/src/app/api/auth/[...all]/route.ts` | Catch-all Next.js route handler (`toNextJsHandler`) |
| `apps/web/src/app/auth/[path]/page.tsx` | Auth pages (sign-in, sign-up, etc.) via `AuthView` |
| `apps/web/src/lib/fetchers/users.ts` | `getLoggedInUser()` -- server-side session reader |
| `apps/web/src/app/dashboard/layout.tsx` | Protected layout with `SignedIn` guard |
| `libs/db-client/src/schema/auth-schema.ts` | Schema: `user`, `session`, `account`, `verification` tables |

---

## Auth Tables

```mermaid
erDiagram
    user {
        uuid id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }

    session {
        uuid id PK
        uuid user_id FK
        text token UK
        timestamp expires_at
        text ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    account {
        uuid id PK
        uuid user_id FK
        text account_id
        text provider_id
        text access_token
        text refresh_token
        text password
        timestamp created_at
        timestamp updated_at
    }

    verification {
        uuid id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    user ||--o{ session : "has"
    user ||--o{ account : "has"
```

---

## 1. Email/Password Signup

```mermaid
sequenceDiagram
    actor User as Browser
    participant AuthPage as /auth/sign-up<br>(AuthView)
    participant Route as /api/auth/[...all]<br>(catch-all handler)
    participant BA as better-auth
    participant Drizzle as Drizzle Adapter
    participant DB as PostgreSQL

    User->>AuthPage: Fill sign-up form
    AuthPage->>Route: POST /api/auth/sign-up<br>{name, email, password}
    Route->>BA: toNextJsHandler(auth)
    BA->>BA: Validate input,<br>hash password
    BA->>Drizzle: Insert user + account
    Drizzle->>DB: INSERT INTO user (id=gen_random_uuid(), ...)
    DB-->>Drizzle: user row
    Drizzle->>DB: INSERT INTO account<br>(provider_id='credential', password=hashed)
    DB-->>Drizzle: account row
    BA->>Drizzle: Create session
    Drizzle->>DB: INSERT INTO session (token, user_id, expires_at)
    DB-->>Drizzle: session row
    BA-->>Route: Set-Cookie: better-auth.session_token
    Route-->>AuthPage: 200 OK + session cookie
    AuthPage-->>User: Redirect to /dashboard
```

---

## 2. Google OAuth

```mermaid
sequenceDiagram
    actor User as Browser
    participant AuthPage as /auth/sign-in<br>(AuthView)
    participant Route as /api/auth/[...all]<br>(catch-all handler)
    participant BA as better-auth
    participant Google as Google OAuth
    participant Drizzle as Drizzle Adapter
    participant DB as PostgreSQL

    User->>AuthPage: Click "Sign in with Google"
    AuthPage->>Route: GET /api/auth/sign-in/google
    Route->>BA: Initiate OAuth flow
    BA-->>User: 302 Redirect to Google consent screen

    User->>Google: Authorize Temar
    Google-->>Route: Callback with auth code<br>GET /api/auth/callback/google?code=...

    Route->>BA: Handle callback
    BA->>Google: Exchange code for tokens
    Google-->>BA: access_token, id_token, profile
    BA->>Drizzle: Upsert user + account
    Drizzle->>DB: INSERT INTO user ... ON CONFLICT (email) DO UPDATE
    DB-->>Drizzle: user row
    Drizzle->>DB: INSERT INTO account<br>(provider_id='google', account_id=google_sub,<br>access_token, refresh_token, id_token)
    DB-->>Drizzle: account row
    BA->>Drizzle: Create session
    Drizzle->>DB: INSERT INTO session (token, user_id, expires_at)
    DB-->>Drizzle: session row
    BA-->>Route: Set-Cookie: better-auth.session_token
    Route-->>User: 302 Redirect to /dashboard
```

---

## 3. Session Validation (Server-Side)

```mermaid
sequenceDiagram
    participant SC as Server Component<br>or Server Action
    participant GLU as getLoggedInUser()
    participant BA as better-auth<br>auth.api.getSession()
    participant DB as PostgreSQL

    SC->>GLU: await getLoggedInUser()
    GLU->>GLU: Read request headers<br>(await headers())
    GLU->>BA: auth.api.getSession({ headers })
    BA->>BA: Extract session_token<br>from Cookie header
    BA->>DB: SELECT * FROM session<br>WHERE token = ? AND expires_at > now()
    DB-->>BA: session row (or null)

    alt Valid session found
        BA->>DB: SELECT * FROM user WHERE id = session.user_id
        DB-->>BA: user row
        BA-->>GLU: { user, session }
        GLU-->>SC: user object
    else No valid session
        BA-->>GLU: null
        GLU-->>SC: null
        SC->>SC: throw Error or redirect
    end
```

---

## 4. Protected Routes (Dashboard Layout)

```mermaid
sequenceDiagram
    actor User as Browser
    participant Next as Next.js Router
    participant Layout as /dashboard/layout.tsx
    participant RTSI as RedirectToSignIn
    participant SI as SignedIn
    participant Page as Dashboard Page

    User->>Next: Navigate to /dashboard/*
    Next->>Layout: Render layout

    Layout->>RTSI: Render RedirectToSignIn
    RTSI->>RTSI: Check auth state<br>(client-side session check)

    alt Not authenticated
        RTSI-->>User: 302 Redirect to /auth/sign-in
    else Authenticated
        RTSI->>RTSI: No-op (renders nothing)
    end

    Layout->>SI: Render SignedIn wrapper
    SI->>SI: Check auth state

    alt Authenticated
        SI->>Page: Render children<br>(SidebarProvider + AppSidebar + content)
        Page-->>User: Dashboard UI
    else Not authenticated
        SI->>SI: Render nothing<br>(children hidden)
    end
```

---

## Auth Configuration Summary

| Setting | Value |
|---------|-------|
| ID generation | `uuid` (via `gen_random_uuid()`) |
| Email/password | Enabled |
| Google OAuth | Enabled (env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`) |
| Base URL | `BETTER_AUTH_URL` env var |
| Trusted origins | `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated) |
| Session cookie | `better-auth.session_token` (managed by better-auth) |
| User extra fields | `notionPageId` (optional, legacy from Notion sync) |

---

## Inter-Service Auth

Backend microservices (fsrs-service, question-gen-service, answer-analysis-service) do **not** participate in the session system. They authenticate incoming requests from the web app using:

- **`x-api-key`** header -- shared secret per service
- **`x-user-id`** header -- user identity forwarded by the web app after session validation
