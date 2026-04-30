# UI Standards

## Component Library: shadcn/ui — No Exceptions

All UI in this project is built exclusively from **shadcn/ui** components. This is a hard rule.

- **Do not create custom UI components.** If a component does not exist in shadcn/ui, install it via the CLI: `npx shadcn@latest add <component>`.
- **Do not reach for raw HTML elements** (`<button>`, `<input>`, `<select>`, etc.) in place of their shadcn equivalents.
- **Do not use any other component library** (MUI, Chakra, Radix primitives directly, Headless UI, etc.).
- Components live in `src/components/ui/` and are imported from `@/components/ui/<name>`.

### Adding a new component

```bash
npx shadcn@latest add <component-name>
```

Browse the full component catalog at https://ui.shadcn.com/docs/components.

### Configuration

| Setting | Value |
|---|---|
| Style | `radix-nova` |
| Base color | `neutral` |
| CSS variables | enabled |
| Icon library | `lucide-react` |
| RSC | enabled |

---

## Date Formatting: date-fns — No Exceptions

All date formatting and manipulation must use **date-fns**. No other date library (`dayjs`, `moment`, native `Date.toLocaleDateString`, `Intl.DateTimeFormat`, etc.) is permitted.

### Preferred patterns

```ts
import { format, formatDistanceToNow, parseISO } from "date-fns";

// Display a date
format(date, "MMM d, yyyy");           // Apr 30, 2026
format(date, "EEEE, MMMM d");         // Wednesday, April 30

// Relative time
formatDistanceToNow(date, { addSuffix: true }); // "3 days ago"

// Parse an ISO string before formatting
format(parseISO(isoString), "MMM d, yyyy");
```

### Rules

- Always `parseISO` when the input is a string before passing to any date-fns function.
- Never call `new Date(string)` for display purposes — use `parseISO`.
- Locale support: import and pass a locale from `date-fns/locale` when the UI needs to be localized.

---

## Icons

Use **lucide-react** (already bundled with shadcn/ui). Do not install a second icon library.

```tsx
import { ShoppingCart, Trash2, Plus } from "lucide-react";
```

---

## Tailwind CSS

Tailwind v4 is in use. Key differences from v3:

- Configuration lives in `src/app/globals.css` inside `@theme { ... }` blocks — **not** in `tailwind.config.*`.
- Import Tailwind with `@import "tailwindcss"`, not `@tailwind base/components/utilities` directives.
- Custom design tokens must be defined in the `@theme` block in `globals.css`.

Use Tailwind utility classes for layout and spacing. Do not write custom CSS unless a Tailwind utility genuinely does not exist for the need.
