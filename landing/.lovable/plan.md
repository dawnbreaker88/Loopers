## Loopers Landing Page

A single-page premium landing site for "Loopers" quick-commerce, built on the existing TanStack Start + Tailwind v4 stack. The provided grocery bag illustration becomes the hero centerpiece and dictates the palette (soft blue #4FB3E8-ish from the logo, beige/kraft #C89968 from the bag, fresh green #6BAF5F from the leaves, warm off-white background).

### Design system (src/styles.css)

Replace the default shadcn slate tokens with a Loopers palette:

- `--background`: warm off-white (oklch ~0.99 0.008 90)
- `--foreground`: deep charcoal
- `--primary`: Loopers blue (from logo)
- `--secondary`: fresh green
- `--accent`: warm beige/kraft
- Gradient tokens: `--gradient-hero`, `--gradient-blob-1/2/3`, `--gradient-card`
- Shadow tokens: `--shadow-soft`, `--shadow-lift`, `--shadow-glow`
- Radius bumped to 1rem for pill/rounded feel
- Load Instrument Serif (display) + Plus Jakarta Sans (body) via `<link>` in `__root.tsx`; register as `--font-display` / `--font-sans` in `@theme`
- Add keyframes: `float`, `swing`, `blob`, `fade-up`, `shimmer`

### Assets

- Upload `user-uploads://Loopers_bag.png` via `lovable-assets` CLI → `src/assets/loopers-bag.png.asset.json`
- Use its blue for the logo color match

### Route & metadata

- Rewrite `src/routes/index.tsx` (replace placeholder) with the landing page
- Update `__root.tsx` head: title "Loopers — Groceries Delivered in Minutes", matching description, og/twitter tags
- Add leaf-level `og:image` on index pointing at the hero illustration (absolute URL via `getRequestOrigin` server fn)

### Component structure

```
src/components/landing/
  Navbar.tsx          scroll-blur, mobile drawer
  Hero.tsx            split layout, animated bag, gradient blobs, floating grocery icons
  StatsStrip.tsx      4 counters (50K+, 10K+, 25+, 4.9★)
  Features.tsx        6 feature cards with Lucide icons, hover lift
  Categories.tsx      8 rounded category cards with colored icon tiles
  HowItWorks.tsx      4-step vertical/horizontal timeline with connectors
  Testimonials.tsx    3 review cards with avatar placeholders + 5-star row
  OfferBanner.tsx     large rounded gradient banner, ₹150 OFF, Claim CTA
  DownloadApp.tsx     phone mockup (CSS) + Play/App Store buttons
  Footer.tsx          columns + social icons
  ui/
    SectionHeading.tsx
    GradientBlob.tsx
    FloatingIcon.tsx
```

All animations use `framer-motion` (already common; will `bun add motion` if missing) with `whileInView` fade-up, `whileHover` scale, and infinite `animate` on the hero bag (y-float + subtle rotate swing).

### Interactions

- Navbar: `useScroll` → backdrop-blur + border appears past 20px
- Buttons: `hover:scale-[1.03] active:scale-[0.98]` via transitions
- Cards: `hover:-translate-y-1 hover:shadow-lift`
- Hero bag: continuous `y: [0,-14,0]` 4s + `rotate: [-1.5,1.5,-1.5]` 6s, soft shadow ellipse scales inversely
- Gradient blobs: slow 12s scale/translate loops
- Section reveals: `initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:"-80px"}}`

### Responsive

- Mobile-first; hero stacks (illustration above copy on <lg), nav collapses to sheet, categories 2-col → 4-col → 8-col, features 1/2/3-col grid
- Uses the `grid-cols-[minmax(0,1fr)_auto]` header pattern from guidelines

### Accessibility

- Semantic `<header><main><section aria-labelledby><footer>`
- All icons decorative marked `aria-hidden`, interactive elements have labels
- Focus-visible rings using `--ring`
- `prefers-reduced-motion` disables infinite animations

### Technical notes

- Pure frontend, no backend, no Cloud
- All copy exactly per spec
- No hardcoded color classes — everything through semantic tokens/gradient utilities
- Single H1 in hero; section H2s below
- Lazy-load below-fold sections' heavier motion via `whileInView`

### Out of scope

- Auth, cart, product pages (Login/Sign Up buttons are visual only)
- Real app store links (placeholder `#`)
