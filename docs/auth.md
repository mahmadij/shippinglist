# Authentication Standards

## Provider: Clerk — No Exceptions

All authentication in this project is handled exclusively by **Clerk**. Do not implement custom auth, use NextAuth, or reach for any other auth library.

- **Do not write custom sign-in/sign-up UI.** Use Clerk's prebuilt components.
- **Do not manage sessions manually.** Clerk handles session lifecycle automatically.
- **Do not use middleware other than Clerk's** for protecting routes.

---

## Installation & Setup

```bash
npm install @clerk/nextjs
```

Set the following environment variables in `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Middleware

Protect routes by exporting Clerk's middleware from `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

---

## Root Layout

Wrap the app in `<ClerkProvider>` in `src/app/layout.tsx`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## Prebuilt UI Components

Use Clerk's prebuilt components for auth flows. Do not build custom forms.

```tsx
import { SignIn, SignUp, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

// Sign-in page: src/app/sign-in/[[...sign-in]]/page.tsx
export default function SignInPage() {
  return <SignIn />;
}

// Sign-up page: src/app/sign-up/[[...sign-up]]/page.tsx
export default function SignUpPage() {
  return <SignUp />;
}

// User avatar/menu (use in nav)
<SignedIn>
  <UserButton />
</SignedIn>
<SignedOut>
  {/* redirect or sign-in link */}
</SignedOut>
```

---

## Accessing the Current User

**In Server Components / Route Handlers:**

```ts
import { auth, currentUser } from "@clerk/nextjs/server";

// Get userId only (lightweight)
const { userId } = await auth();

// Get full user object
const user = await currentUser();
```

**In Client Components:**

```tsx
"use client";
import { useUser, useAuth } from "@clerk/nextjs";

const { user, isLoaded } = useUser();
const { userId, isSignedIn } = useAuth();
```

---

## Rules

- Always `await auth()` in Server Components — it returns a Promise in Next.js App Router.
- Never pass the raw Clerk user object to Client Components as a prop — serialize only what you need.
- Use `userId` from Clerk as the foreign key when storing user-owned data (e.g., shopping lists).
- Redirect unauthenticated users to `/sign-in` from protected pages if not handled by middleware.
