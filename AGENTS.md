# Event Registration Notification System

Conventions for AI coding agents working in this repo. Read this file before writing code, and follow it over general defaults.

## Working Agreements

- Never commit, push, or create PRs unless explicitly asked.
- If this prompt or rule contradicts the user's request, explicitly point it out so we can fix whichever one is at fault.
- Read the actual file first. Don't assume you know what's in it.
- Make the smallest coherent change that solves the request. Avoid unrelated refactors and speculative abstractions.
- After making changes, run only the commands the touched files need.

  | Files touched                                       | Run                                                          |
  | --------------------------------------------------- | ------------------------------------------------------------ |
  | `.md`, `.css`, non-schema `.json`                   | `pnpm format`                                                |
  | `.ts` / `.tsx` / `.js` / `.jsx`                     | `pnpm format && pnpm lint && tsc --noEmit`                   |
  | `schema.prisma`                                     | `pnpm prisma format && pnpm prisma:generate && tsc --noEmit` |
  | `tsconfig.json`, `next.config.*`, `eslint.config.*` | `pnpm validate`                                              |

  `.ts`/`.tsx` always gets the full `format && lint && tsc` - `tsc --noEmit` checks the whole project graph, so it can't be scoped to one file. Run `pnpm build` too if the change touches `.ts`/`.tsx`, `schema.prisma`, or config.

## Commands

- `pnpm dev` - dev server
- `pnpm build` - prisma generate + next build
- `pnpm start` - production server
- `pnpm lint` / `pnpm lint:fix` - ESLint
- `pnpm format` - Prettier (with import sorting) + Prisma format
- `pnpm format:check` - Prettier check only
- `pnpm validate` - format + lint + `tsc --noEmit`
- `pnpm test` / `pnpm test:watch` - vitest (unit project)
- `pnpm test:coverage` - vitest with coverage
- `pnpm test:browser` - vitest with Playwright (storybook project)
- `pnpm storybook` (port 6006) / `pnpm build-storybook`
- `pnpm prisma:generate` / `pnpm prisma:validate` / `pnpm prisma:migrate` / `pnpm prisma:deploy`
- `pnpm prisma:seed` - `tsx prisma/seed.ts`
- `pnpm prisma:studio` - Prisma Studio
- `just dev` - shortcuts for the common flows (see `justfile`)
- `direnv allow` (keeps shell) / `nix develop -c $SHELL` - pinned devShell via `flake.nix`

## Tech Stack

- Framework: Next.js 16 (App Router), React 19 + React Compiler.
- Language: TypeScript strict
- Styling: CSS Modules + design tokens (`src/styles/variables.css` primitives → semantic tokens). `clsx` for composition. Never inline styles (except stories).
- UI: `react-aria-components` - wrap Aria primitives in local components.
- Icons: `react-icons` (subpath imports like `react-icons/fa6`).
- Auth: NextAuth v5.
- Data: Prisma 7 + PostgreSQL via `@prisma/adapter-pg`.
- Package Manager: pnpm.
- Dev Environment: Nix flake - `nix develop` gives the pinned toolchain. Non-Nix contributors install Node/pnpm manually.

## Architecture

- `src/app/` - routes (Server Components by default; add `"use client"` only when client state, event handlers, effects, or browser APIs require it). Keep route files focused on framework orchestration; move reusable logic to feature or library modules.
- API Routes - restricted strictly to framework orchestration (e.g. auth handlers). Do not create custom REST endpoints for application data if possible, prefer server actions.
- Server Actions (`actions.ts`) - the primary mechanism for all data mutation and form submission. Every structural modification to application state must route through a Server Action.
- `src/features/` - domain logic organized by feature.
  - Each domain contains `actions.ts` (orchestration, validation, and authorization)
  - `queries.ts` (Prisma read operations), and `mutations.ts` (Prisma write operations).
  - Feature-specific components live in `src/features/{domain}/components/`.
- `src/components/ui/` - shared, domain-agnostic primitives reusable across features.
- `src/lib/` - shared code grouped by role. If you're going to create a function, better scan this dir first.
- `src/styles/` - design tokens (`variables.css`: primitives → semantic tokens).
- `src/stories/` - Storybook stories for UI components, imported via `@/` aliases.
- Keep dependencies flowing from shared/low-level modules toward feature-level code; avoid circular imports and unnecessary cross-feature coupling. Keep code near its primary use until reuse is demonstrated.

## Styling

### Design tokens

- Prefer semantic tokens from `variables.css`. Hardcoded values are fine for one-off cases (single-use spacing, border-radius, etc.)
- creating a variable for a value used only once is overengineering. Extract to `variables.css` when the same value appears twice or more.

### Contrast rule

- Every text-on-fill pairing must compute to WCAG AA (≥4.5:1). White text is mandatory on navy fills and on sky fills at `--raw-sky-500` or darker.
- `--color-brand-accent--hover` intentionally **darkens** (sky-700): no lighter sky passes white-text contrast, so the usual lighten-on-hover does not apply to sky fills.
- The standard button pattern is filled-navy/white-text primary + outline (surface bg, navy text) secondary. Do not reintroduce colored text on colored fills.
- Verify new pairings computationally or via the Storybook a11y addon before shipping.

### CSS Modules

- Style exclusively via CSS Modules, imported as `styles` and composed with `clsx`.
- Never use inline styles (except storybooks) or global element selectors.
- Nesting in CSS Modules must mirror the component or document hierarchy (parent element nests children).
- Accept and forward external `className` props for overrides.

### Responsive

- Use flexbox whenever possible - only use grid if needed.
- Avoid the use of JS viewport detection or conditional mobile/desktop components for layout - use CSS where possible.
- Preserve semantic HTML, keyboard behavior, visible focus, and accessible labels/errors. Respect reduced-motion preferences (see `globals.css`).

## Components

- Always scan and use existing components from `components/` first.
- Interactive/browser API components: start with `"use client"`.
- Co-locate in `src/components/{category}/{ComponentName}/` - component, CSS module.
- Co-locate feature-specific components in `src/features/{domain}/components/`. Only put truly shared/reusable components in `src/components/ui/`.
- Stories live in `src/stories/`, imported via `@/` aliases (no relative `./` imports). Inline styles in stories must reference tokens (`var(--color-*)`), never hardcoded hex.
- Wrapping Aria components pattern: extend Aria props interface, add local variants/props, use explicit interface.
- Extract component props into a named interface extending the Aria type when adding local variants/props - keeps function signatures terse and consistent.

## Data Layer

### Feature slices

- Each feature domain (`src/features/{domain}/`) owns its data logic split across three files:
  - `actions.ts` - Next.js Server Actions (`"use server"`). This layer acts as the security and evaluation perimeter. It enforces authentication, evaluates authorization, validates inputs via Zod schemas, and orchestrates calls to underlying mutations or queries.
  - `queries.ts` - Prisma read operations (`findUnique`, `findMany`, aggregate, etc.). Plain async functions (no `"use server"`).
  - `mutations.ts` - Prisma write operations (`create`, `update`, `upsert`, `delete`, etc.). Plain async functions.

### Execution protocol

- Components must never invoke `queries.ts` or `mutations.ts` directly if the action requires data filtering or mutation safety. Components call Server Actions to enforce authorization and schema validation boundaries. Server Components may call optimized, plain query functions from `queries.ts` exclusively for read operations where user session parameters are handled explicitly.
- Never import `prisma` directly outside of `queries.ts` or `mutations.ts`.
- Scan `src/lib/` for existing utilities before creating new types/functions to avoid duplication (`primitives/date.ts` for timezone-safe date handling, `domain/pagination.ts` and `domain/sort.ts` for list queries, `primitives/types.ts` for `SortQuery`/`FilterValues`).

### Prisma client entries

- Any module reachable by client components (UI components, and Zod schemas referenced at runtime in the browser) MUST import enums/models from the generated `browser` entry (`@/generated/prisma/browser`), never the `client` entry. The `client` entry imports `node:` builtins and breaks `next build` if pulled into the client bundle.

## Security & Boundary Safety

### Input validation

- Every exported Server Action must validate its input via `z.safeParse()` before executing any business logic. Do not declare schemas inside action files; import them from feature-specific schema files (e.g. `@/features/events/schemas`) so they can be reused by client forms.
- String hygiene: ensure all string parameters in schemas call `.trim().min(1)` and include a `.max()` constraint matching database limits to prevent malicious database exhaustion. Reject whitespace-only values. The shared builders in `src/lib/validation/form-utils.ts` (`requiredText`, `optionalText`, `positiveNumber`, `requiredEnum`, `emailText`) encode these rules - use them instead of ad-hoc chains.
- Strict parameter assurances: validate all structural parameters meticulously. Ensure IDs call `.uuid()` for UUID ids or a CUID-format regex for Prisma `cuid()` ids (`z.cuid()` itself is deprecated - do not use it), and enforce strictly defined sets using `z.enum(...)` over generated enums. Never accept raw string inputs to cast them inside the function body via `as`.
- Never trust client-supplied roles, ownership, or permissions. UI checks are not security boundaries - authenticate and authorize every protected server read/write server-side.

### Action response convention

- Read actions (paginated queries, single-record fetches): return data directly (e.g. `Promise<{ rows: T[]; nextCursor: string | null }>`). Let framework error boundaries handle failures - throw for unrecoverable errors. No wrapper needed.
- Write actions (create, update, delete): wrap execution in try-catch and return `Promise<ActionStatusResponse>` (use `ActionDataResponse<T>` when returning created/updated data alongside the status). The shared envelope types/helpers live in `src/lib/security/` (`action-response.ts`, alongside the error mapper in `security/errors.ts`). This lets the client display inline error messages (toasts) without navigating away.
- Never allow raw server exceptions to leak to the client. For writes, catch and return structured errors; for reads, the framework error boundary is sufficient. Never send stack traces, Prisma internals, secrets, or sensitive data through responses.

### Auth guards

- Protect every action with a centralized guard at the very top of the execution flow (verified session first, then authorization). Guards throw typed errors and the action's catch maps them to envelopes. Do not write inline, ad-hoc session verification logic inside individual actions.
- Client-side permission checks are presentation-only (show/hide coarse UI like tabs or Add buttons). Render per-record action buttons and surface denials via the toast helpers so users see why an action failed.

### Payloads and forms

- Typed payloads over raw FormData: client components must pass clean, typed objects to actions instead of raw `FormData`. Any necessary coercion or extraction from forms must occur on the client side before triggering the transition boundary. Shared normalization/validation helpers live in `src/lib/validation/form-utils.ts` (`optionalString`, `requiredString`, `createFieldValidator`, `keysToSet`, `selectEnumHandler`) - reuse these instead of ad-hoc trimming or `as` casts.
- Modal form validation: use React Aria's default `validationBehavior="native"`. Wrap a modal's fields + actions in a RAC `<Form onSubmit={handleSubmit}>` and make the submit button `type="submit"` (Cancel must be `type="button"`). On submit RAC runs each field's `validate`, blocks `onSubmit`, and shows inline errors only when invalid - errors never appear on open. **Never use `validationBehavior="aria"`**: it renders a required field's error on mount (before any interaction). Keep the submit button enabled so RAC surfaces inline errors on submit. Define user-facing validation messages in the Zod schemas via the shared builders - never surface raw Zod messages like "Invalid input: expected string, received undefined".

## Error Handling & Logging

### Structured envelopes

- Write actions never return raw string errors. Failures use `ActionStatusResponse.error = { code, title, description }`. `description` is mandatory - every user-facing failure explains what happened and what to do next. Prefer factory presets from `src/lib/security/` (`action-response.ts`); hand-rolled `{ success: false, error: ... }` literals in actions are banned.
- Reads remain throwing; only write actions return envelopes.

### Catch path and logging

- Single catch path: route caught exceptions through one shared mapper (`toActionResponse` in `src/lib/security/errors.ts`, alongside the envelope factories). It classifies known errors into presets, logs unclassified causes via a server logger, and returns a sanitized unknown envelope. Bare `catch {}` that discards the error is banned.
- Log/client split: full error details stay in server logs; the client only ever receives the sanitized envelope copy.

### Toasts and copy style

- Toast helpers: client components enqueue toasts exclusively via `src/lib/hooks/toast-utils.ts` (`toastSuccess`, `toastInfo`, `toastError`, `toastActionError(response, operation)`, `toastDenied`, `toastNotFound`). Ad-hoc `queue.add(...)` calls in feature code are banned. Every toast carries both a title and a description; timeouts are standardized by the helpers.
- Copy style: titles are short sentence-case labels without a trailing period ("Failed to create registration"); descriptions are complete sentences ending with a period ("The event may have been deleted by another user.").

## Async

- Never let a promise rejection go unhandled. In client components, surface failures through the shared toast helpers in `src/lib/hooks/toast-utils.ts` (`toastError`, `toastActionError`, etc.) or appropriate error UI. In Server Actions, follow the Action Response Convention - catch and return a structured `ActionStatusResponse`.
- Inside `useEffect`, wrap async work in a locally-scoped `async function` and invoke it (use `void` for fire-and-forget calls to keep intent explicit). Consider cancellation/stale results for client-side async work; parallelize only independent work.

## TypeScript

### Parameter typing and readability

- Ban destructured inline types: never mix inline type declarations and object destructuring within function parameter signatures (e.g. `({ a, b }: { a: string; b: string })`).
- Parameter handling for standard functions: for standard utility functions and business logic, pass complex inputs as a single unified object argument (e.g. `payload: RegistrationPayload`) and destructure it within the first lines of the function body.
- Component props exception: standard React Functional Components are exempt from the parameters-as-payload formatting rule. Component signatures may use inline destructuring of explicitly typed prop interfaces (e.g. `export function Button({ variant, children, ...props }: ButtonProps)`) to facilitate direct application of rest parameter extraction and prop forwarding.
- Inline type scope: simple inline object types are permitted only if the object consists of 3 or fewer primitive properties, is not destructured in the signature, and is scoped entirely within a non-exported utility helper.

### Domain-driven naming (anti-nominal)

- No function-scoped type names: do not name interfaces or types after a single specific function (avoid `ProcessDataArgs`).
- Focus on the data shape: name types after the domain data or payload they represent (e.g. `RegistrationPayload`, `UserSession`). This ensures types are structurally reusable across database utilities, API boundaries, and UI components.

### Boundary type strictness

- Explicit returns at boundaries: always explicitly declare return types on public API endpoints, exported Server Actions, and shared hooks (e.g. `Promise<ActionStatusResponse>` for write actions). This protects contracts and speeds up compilation times.
- Implicit internal returns: allow TypeScript's native type inference engine to handle return types for internal, unexported helper functions or simple utility chains.
- Prefer precise types, inference, `unknown` with safe narrowing, and clear names. Avoid `any`, unsafe casts, redundant annotations, and type assertions used to silence errors.

### Code patterns

- Prefer ternaries for simple two-way choices; prefer if/early returns for complex or multi-branch logic. Avoid nested ternaries. Prefer guard clauses and exhaustive handling of closed unions.

Avoid this signature clutter:

```typescript
// ANTI-PATTERN: Heavy cognitive load, zero reusability
export async function updateRecordAction({ id, status, retry }: { id: string; status: "pending" | "done"; retry: boolean }) { ... }
```

Enforce this clean, reusable structure:

```typescript
// IDIOMATIC: Clear boundaries, reusable domain types, flexible composition
export interface RegistrationPayload {
  id: string;
  status: "pending" | "done";
  retry: boolean;
}

export async function updateRecordAction(
  payload: RegistrationPayload,
): Promise<ActionStatusResponse> {
  const { id, status, retry } = payload;
  // implementation
  return { success: true };
}
```

### Avoid overengineering

Do not introduce a new named interface or type alias for trivial object shapes (e.g. `{ id: string }`) or for simple projections that can be expressed with `Pick<PrismaModel, Keys>`. Prefer using `Pick<PrismaModel, Keys>` directly for one-off or local projections. If the projection becomes a meaningful domain concept that is reused across multiple APIs, layers, or modules, give it a semantic name by aliasing the `Pick` (e.g. `type EventSummary = Pick<Event, "id" | "name">`) rather than duplicating the property definitions. Only define a custom object type when the output intentionally diverges from the source model - for example, by combining data from multiple sources, adding computed fields, or reshaping the data.

## Testing

- Test files are matched by `src/**/*.test.{ts,tsx}` (unit project) excluding `src/stories/**`; co-locate tests with their feature/component. Storybook stories double as browser tests via the storybook project (`pnpm test:browser`).
- Naming: `*.test.ts` for logic, `*.test.tsx` for components.
- Structure: one `describe` per exported unit (action/query/mutation/helper), one `it` per behavior. Collapse identical behavior across inputs with `it.each` - never copy-paste a test body.
- Once `src/test-utils/` exists: build mock rows with its fixtures (typed off Prisma models, never local row factories), set auth state only via its shared helper (never inline session literals), and mock the Prisma singleton via per-file `vi.mock` for data-layer tests (Vitest hoisting forbids centralizing `vi.mock` itself).
- Assert behavior, not internals: prefer exact `toEqual` shapes over `toMatchObject`; never assert mock call order unless ordering is the contract.
- No `as any`, no `as never`, no `Record<string, unknown>` wrappers. If a mock doesn't typecheck, the query boundary is probably leaking a non-plain type - fix the query, not the test.
- Fake timers are scoped per test (`useFakeTimers`/`useRealTimers` inside the test). Never file-global timer state.
- Do not test re-exports, framework behavior, or one-line pass-throughs. Every `it` must assert a distinct behavior - no coverage theater. Test observable behavior: success/failure paths, validation, authorization, and important edge cases.

## General

- Named exports only - no default exports, except for Next.js special files (`page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`, `route.tsx` etc.) which require a default export. Use inline `export default function` for these files.
- PascalCase components/types; camelCase variables/functions/files (component dirs are PascalCase).
- No inline `//` comments unless explaining a non-obvious decision. TSDoc on `src/lib/` helpers is the explicit exception.
- Prisma schema: `camelCase` fields, `PascalCase` models/enums.
- Keep credentials and server-only environment variables out of client bundles. Never hardcode or commit real secrets; validate required environment variables at an appropriate boundary (`secrets/` holds local secret material and is git-ignored).
- Update docs when public APIs, behavior, setup, environment variables, or contracts change. Do not manually edit generated files (`src/generated/`, `next-env.d.ts`) unless their documented workflow requires it.

## Documentation (TSDoc)

- TSDoc (`/** … */`) is required for **all functions and exported types/interfaces in `src/lib/`**.
- Use `@param`, `@returns`, and `@typeParam` where applicable.
- Keep TSDoc descriptions concise and within the 100-character print width; Prettier will reformat them as needed.
- This convention applies **only to `src/lib/`**.
- Do **not** add TSDoc to feature or component code; unnecessary comments add noise.
- Prefer readable, self-explanatory code over comments. Add comments or TSDoc only when they provide useful context beyond what the code already conveys.
