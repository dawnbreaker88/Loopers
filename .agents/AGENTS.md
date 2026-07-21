# Loopers AI Engineering Handbook & Development Guidelines (`AGENTS.md`)

This file acts as the authoritative guide for every AI coding agent and developer working on the **Loopers** repository. All work in this repository must strictly adhere to the standards, architecture, and principles documented below.

---

## 1. Project Overview

**Loopers** is a student-focused, hyperlocal quick-commerce platform delivering instant essentials with campus-first speed.

- **Stack**: MERN (MongoDB, Express.js, React 18, Node.js)
- **Architecture**: Modular, Mobile-First Progressive Web App (PWA)
- **Real-Time Layer**: Socket.io for live order tracking, rider tracking, and store availability updates
- **State & Data**: Redux Toolkit for centralized state management, Axios with interceptors for API communication
- **Engineering Goal**: **Production Quality**. Build robust, scalable, production-grade code rather than MVP-quality hacks or temporary shortcuts.

---

## 2. Core Principles

Every feature and refactoring task must prioritize:

1. **Correctness**: Code must function strictly according to spec and handle edge cases deterministically.
2. **Maintainability**: Clear file structure, modular functions, and predictable data flow.
3. **Readability**: Expressive naming conventions, self-documenting code, and clean organization.
4. **Scalability**: High throughput API patterns, efficient MongoDB queries, and decoupled components.
5. **Performance**: Optimized renders, lightweight bundles, fast asset loading, and cached queries.
6. **Accessibility**: Full screen-reader, keyboard, and high-contrast support.
7. **Mobile-First Design**: Primary focus on small touchscreens and mobile PWA viewports before desktop scaling.
8. **Robust Error Handling**: Graceful degradation under network dropouts, API errors, and invalid inputs.

> ⚠️ **Rule**: Never implement quick temporary fixes or patches if a proper, long-term architectural solution exists.

---

## 3. Development Standards

- **Small Reusable Components**: Break complex pages into single-responsibility, modular React components.
- **Single Responsibility Principle**: Each module, helper, or component must fulfill exactly one well-defined purpose.
- **DRY (Don't Repeat Yourself)**: Eliminate duplicated logic across frontend and backend. Extract shared helpers and hooks.
- **Zero Dead Code**: Remove unused imports, unreferenced components, dead utility functions, and commented-out legacy code.
- **Naming Conventions**:
  - React Components: `PascalCase.jsx` (e.g., `ProductCard.jsx`, `NotificationPermissionPrompt.jsx`)
  - Utility Files / Hooks: `camelCase.js` / `useHook.js`
  - CSS Variables & Design Tokens: `var(--sys-*)` / Tailwind system tokens
  - Redux Slices: `entitySlice.js`
- **Modular Architecture**: Separate UI components, page views, API services, state management, and utility helpers cleanly.

---

## 4. Design System & Token Enforcements

All styling must align with the established design system tokens:

- **Tokens over Hardcoded Values**: All colors, background surfaces, borders, and typography must use system design tokens (`var(--sys-background)`, `var(--sys-surface)`, `var(--sys-text-primary)`, `primary-500`, etc.).
- **Never Hardcode Colors**: Do NOT write arbitrary hex colors (e.g., `#ffffff`, `#000000`) inline unless defining design tokens in CSS variables.
- **Never Hardcode Spacing or Typography**: Use standardized Tailwind spacing steps (`px-4`, `py-3`, `gap-2`, `rounded-2xl`) and system typography utility classes.
- **Theme Support**: Every UI element must support **Dark Mode** and **Light Mode** seamlessly using Tailwind `dark:` variants and CSS variable tokens.

---

## 5. UI Philosophy

The Loopers UI is inspired by modern quick-commerce leaders (**Blinkit** and **Zepto**), but crafted to be unique, student-tailored, and distinct.

### UI Characteristics:
- **Lightning Fast**: Instant feedback, optimistic UI updates, and zero layout shift.
- **Clean & Premium**: Generous whitespace, refined micro-interactions, subtle glassmorphic surfaces, and rich gradient highlights.
- **Rounded Aesthetics**: Smooth rounded corners (`rounded-2xl`, `rounded-3xl`, `rounded-full`).
- **Minimal & Focused**: High visual hierarchy prioritizing product image, price, delivery speed, and primary action buttons.
- **Touch-Friendly**: Touch targets must be at least **44x44px** with active press feedback (`active:scale-[0.98]`).
- **Micro-Animations**: Smooth, non-distracting transitions (`transition-all duration-200`, `animate-fade-in`).

---

## 6. Responsive Rules & Viewport Verification

Every frontend component and page layout must be verified across all standard mobile, tablet, and desktop viewports:

- **Mobile Range**: `320px` (small), `360px`, `375px`, `390px`, `414px`
- **Tablet**: `768px`
- **Desktop**: `1024px` and above (`max-w-7xl`)

### Constraints:
1. **Zero Horizontal Scrolling**: `overflow-x-hidden` on outer layout containers; pages must never produce horizontal scrollbars.
2. **SafeArea Aware**: Incorporate mobile safe-area padding (`pb-[calc(0.5rem+env(safe-area-inset-bottom))]`) for modern mobile devices.
3. **Adaptive Components**: Navigation adapts between top desktop header and mobile bottom bar (`BottomNav.jsx`).

---

## 7. Backend Standards (Express & Node.js)

- **Input Validation**: Validate every request body, query parameter, and route param (`zod` or explicit validator checks) before business logic.
- **Consistent Responses**: Standardize all API JSON outputs:
  - Success: `{ success: true, message?: string, data... }`
  - Failure: `{ success: false, message: string, errors?: array }`
- **Centralized Middleware**: Handle errors via `asyncHandler` and `errorHandler.js` middleware. Never let unhandled promise rejections crash the server.
- **REST Conventions**: Use standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) with meaningful HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
- **Zero Frontend Trust**: Re-verify prices, stock counts, permissions, and roles on the backend. Never rely solely on client-side calculations.

---

## 8. API & Database Standards (MongoDB & Mongoose)

- **Predictable Schemas**: Maintain strict Mongoose schemas with validation and defaults.
- **Indexing**: Index frequently queried fields (`unique: true`, `{ user: 1 }`, `{ orderStatus: 1, createdAt: -1 }`). Avoid duplicate index declarations.
- **Soft Deletes**: Use soft deletion (`isDeleted: true`) for catalog items and critical data to preserve transaction history.
- **Sparse Indexes**: Mark optional unique fields (e.g., `slug`, `customId`) with `sparse: true` to prevent `E11000` null duplicate key errors.
- **Data Normalization**: Avoid excessive document embedding; reference models (`ref: 'User'`, `ref: 'Product'`) cleanly.

---

## 9. Real-Time & Web Push Standards (Socket.io & Web Push)

- **Socket Listener Cleanup**: Always remove socket listeners (`socket.off(...)` or return cleanup in React `useEffect`) to prevent memory leaks and duplicate handler execution.
- **Authenticated Sockets**: Verify JWT token on socket connection; restrict room join events strictly to authenticated user IDs or `admin` rooms.
- **Automatic Reconnection**: Support transparent socket reconnection and re-sync Redux state without requiring manual page refreshes.
- **Targeted Web Push**:
  - Web Push notifications must target specific user subscriptions (`UserSubscription`) or admin subscriptions (`AdminSubscription`).
  - Automatically prune expired/invalid push endpoints (`404` or `410 Gone`).
  - Do NOT broadcast private notifications to all users.

---

## 10. Performance Optimization

- **Code Splitting & Lazy Loading**: Dynamic route imports for non-critical pages.
- **Memoization**: Use `useMemo` and `useCallback` for expensive data transformations or frequent callbacks.
- **Asset Optimization**: Serve optimized vector SVGs, compressed WebP/PNG images, and external CDN icons with fallback handlers.
- **Skeleton Loaders**: Render branded loader components or content skeletons during data fetching to eliminate visual layout shifts.
- **Render Minimization**: Ensure Redux selectors are granular to avoid unnecessary component re-renders.

---

## 11. Error Handling & Resiliency

Every user feature must gracefully handle all adverse conditions:

- **Offline Mode**: Display offline status banner (`OfflineBanner.jsx`) and utilize service worker caching (`sw.js`).
- **Slow Networks / API Failures**: Display clear toast messages (`react-hot-toast`) and disable action buttons while loading to prevent double submits.
- **Empty States**: Render clean, helpful empty state views when lists, carts, or orders contain no items.
- **Session Expiration**: Catch `401 Unauthorized` responses in Axios interceptors and redirect cleanly to `/login` after clearing expired tokens.
- **Uncrashable UI**: Wrap complex route boundaries in React Error Boundaries. The UI should never produce a white screen of death.

---

## 12. Accessibility (a11y)

- **Semantic HTML**: Use proper HTML5 elements (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<button>`).
- **Keyboard Navigation**: Ensure all interactive elements are reachable via `Tab` and triggerable via `Enter` / `Space`. Handle `Escape` key for overlays and dropdowns.
- **Focus Management**: Clear, high-contrast focus rings (`focus:outline-none focus:border-primary-500`).
- **Screen Readers**: Provide `aria-label`, `aria-expanded`, `aria-haspopup`, and `alt` tags on images and icon-only buttons.

---

## 13. Testing & Verification Checklist

Before declaring any task or feature complete, manually verify:

- [ ] **Happy Path**: Core user flow works end-to-end without errors.
- [ ] **Edge Cases**: Empty lists, max values, zero values, rapid double clicks.
- [ ] **Mobile Responsiveness**: Verified on 320px, 375px, 390px, 414px viewports without horizontal scroll.
- [ ] **Theme Switching**: Tested in both Light Mode and Dark Mode.
- [ ] **Authentication**: Logged-in customer, logged-in admin, unauthenticated visitor.
- [ ] **UI States**: Loading, Error, Empty, and Success states verified visually.
- [ ] **Real-Time Sync**: Socket events and Redux state update automatically without manual page refresh.

---

## 14. Definition of Done (DoD)

A task is considered **Done** only when:

1. No browser console errors or unhandled warnings exist.
2. No ESLint or code syntax warnings exist.
3. Responsive design is verified on all supported mobile and desktop viewports.
4. Dark Mode and Light Mode styling is verified for visual harmony.
5. Backend integration is complete with input validation and error handling.
6. Redux state and Socket.io events are fully synchronized.
7. Service Worker & Push Notifications function without errors.
8. No broken routes or unhandled fallbacks exist.
9. All dead code, debug console logs, and unused imports have been removed.
10. Codebase is cleaner and more maintainable than before the task started.

---

## 15. AI Agent Expectations & Instructions

When working as an AI agent on this codebase:

- **Read Before Modifying**: Inspect existing components, schemas, and state slices before writing new code.
- **Preserve Architectural Consistency**: Follow established patterns in `store/`, `services/`, `controllers/`, `models/`, and `components/`.
- **Refactor Over Rewrite**: Improve and refactor existing modular code rather than executing wholesale rewrites.
- **Explain Design Decisions**: Summarize key architectural changes, trade-offs, and file updates clearly.
- **Never Introduce Silent Side Effects**: Update all call sites when modifying shared helper signatures or APIs.
- **Leave Code Cleaner**: Treat every task as an opportunity to reduce technical debt and refine quality.
