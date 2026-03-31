# Ergon — Design Specification

> *Ergon (Greek: ἔργον, "work") — the equivalent of Latin "opus."*
> A platform where artists learn to make generative art, and where that art lives as a living medium.

---

## 1. Platform Identity & Positioning

### What Ergon Is

Ergon is a **creative tool that happens to be a platform**, not a platform that happens to have tools. The studio is the center of gravity. Everything else — the gallery, the community, the marketplace — orbits around the act of making.

The closest analogy: **Bandcamp for generative art.** Bandcamp didn't build another Spotify. It built the best place for independent musicians to publish, sell, and own their relationship with listeners. Ergon does the same for artists who make work with code.

### What Makes Ergon Different

| Platform | What it is | What Ergon does differently |
|---|---|---|
| **Art Blocks** | Crypto-native generative art marketplace. Drops, editions, Ethereum. | Ergon is creator-first, not collector-first. The tool is the product, not the market. Crypto is optional, not required. |
| **fxhash** | Open generative art platform on Tezos. More accessible than Art Blocks but still crypto-native. | Ergon doesn't assume you already know p5.js. The hybrid editor lowers the floor dramatically. |
| **Processing / p5.js** | Creative coding frameworks. Powerful but intimidating — blank editor, documentation walls. | Ergon wraps these in a visual layer. You start by manipulating parameters, not writing `setup()` and `draw()`. |
| **Are.na** | Curation and research tool. Beautiful sensibility but no creation tools. | Ergon brings Are.na's editorial taste to a platform where you also *make* the work. |
| **Foundation / SuperRare** | Fine art NFT marketplaces. Gallery-focused, collector-driven. | Ergon's primary verb is creating, not collecting. The gallery serves the studio, not the other way around. |

### Cultural Positioning

Ergon sits at the intersection of three communities:

1. **Artists who want to code** (primary) — painters, illustrators, graphic designers who are drawn to generative art but find Processing/p5.js/ShaderToy intimidating. They know what they want to make. They don't know how to make the computer do it.
2. **Creative coders** (secondary) — people already in the p5.js/three.js/GLSL world who want a better home for their work than Twitter threads and CodePen embeds.
3. **Design-literate appreciators** — the Are.na crowd, the Swiss Poster crowd, people who care about visual culture and want to experience generative art with the same intentionality they bring to a gallery visit.

Ergon is **not** for:
- Crypto speculators looking for the next flip
- AI art generators (this is about learning to code, not prompting)
- General-purpose creative coding (Ergon is opinionated about visual/generative output)

### Brand Voice

**Precise. Quiet. Confident. Warm.**

- Precise — every word, every pixel, every interaction is deliberate
- Quiet — the platform recedes so the art can speak
- Confident — strong opinions held lightly, not hedging or apologizing
- Warm — approachable despite the minimalism, never cold or exclusionary

---

## 2. Core Product Features

### The Creator Experience

#### The Studio (Hybrid Editor)

The studio is Ergon's core product. It's a creative environment with **two layers**:

**Layer 1 — Visual Surface (default view)**
- Parameter controls: sliders, color pickers, toggles, dropdowns
- Live preview canvas that updates in real-time as parameters change
- Template library: curated starting points organized by technique (particle systems, flow fields, noise landscapes, geometric patterns, color studies)
- Artists start here. They pick a template, manipulate parameters, see results immediately. No code required.

**Layer 2 — Code Editor (pull up from below)**
- Full code editor with syntax highlighting, autocomplete, error highlighting
- The code is always in sync with the visual parameters — tweak a slider, see the code change. Edit the code, see the slider move.
- Inline documentation: hover any function for explanation + visual example
- AI-assisted suggestions (not generation — assistance): "You're using noise(). Here's how to layer octaves for more organic texture."
- Gradual disclosure: the editor shows only what's relevant. A beginner sees 20 lines. An advanced artist sees the full source.

**The learning gradient:**
1. **Explorer** — pick a template, play with sliders, save outputs
2. **Tweaker** — open the code, change a number, see what happens
3. **Modifier** — understand the structure, add a new parameter, fork the logic
4. **Creator** — write from scratch, publish original algorithms

This gradient is implicit, not gamified. No badges, no levels. The tool just gets out of the way as you learn.

#### Publishing Flow

1. Artist creates a piece in the studio
2. Configure: title, description, tags, preview seed(s)
3. **Define the edition model:**
   - Open edition (anyone can mint/purchase an output at any time)
   - Limited edition (fixed number of unique outputs from the algorithm)
   - Unique (single output, like a traditional artwork)
   - Free / not for sale (the default — art doesn't have to be a commodity)
4. Set price (if selling) — platform suggests based on comparable work
5. Publish — the piece goes live on the artist's profile and is eligible for gallery curation

#### Artist Profile

- Clean, portfolio-style page. The artist's name, bio, links, and their works.
- Custom subdomain option: `artist.ergon.art`
- Process section: optional space for artists to share sketches, iterations, thinking
- No follower counts displayed prominently. No vanity metrics.

### The Viewer/Collector Experience

#### Discovery — Gallery Mode

The gallery is **editorially curated**, not algorithmically driven. This is a deliberate choice:

- **Curated exhibitions** — themed collections assembled by Ergon's editorial team (initially you, later community curators). "Studies in Noise." "Geometric Minimalism." "Color as Material."
- **New arrivals** — chronological feed of recently published work, lightly filtered for quality
- **Artist spotlights** — editorial features on individual artists and their process
- **No trending, no popularity metrics, no engagement optimization.** The gallery is a museum, not a feed.

The gallery layout is a **considered grid** — not a masonry wall of thumbnails. Each piece gets enough space to breathe. Whitespace is structural. The grid adapts to the work (landscape, portrait, square) rather than forcing everything into uniform cards.

#### Experiencing — Immersive Mode

Click any piece in the gallery and the **signature transition** happens: the grid falls away, the piece expands to fill the viewport, and you're inside the work. This is full-bleed, no-chrome, just you and the art.

In immersive mode:
- The piece renders live (not a static image)
- If the artist enabled interaction, you can manipulate parameters
- Seed exploration: step through different outputs from the same algorithm
- Minimal overlay (appears on hover): title, artist, edition info, collect button
- Press Escape or swipe to return to the gallery — the reverse transition

**The transition between gallery and immersive mode is Ergon's signature interaction.** It should feel like stepping into a room. Not a page load. Not a modal. A spatial shift.

#### Collecting

- Collecting is **opt-in for artists** and **frictionless for collectors**
- Traditional payment (Stripe) by default
- Crypto payment optional (if the artist has enabled it)
- When you collect a piece, you get:
  - A unique output (specific seed) from the algorithm
  - High-resolution render
  - The right to display it (your collection page, digital frame, etc.)
  - If crypto: on-chain provenance
- Your collection lives on your profile — a personal gallery of acquired works

### Community & Social Features

**What matters:**
- **Collections as curation** — collectors build public collections, which become a discovery vector (like Are.na channels)
- **Process sharing** — artists can publish sketches, iterations, and process notes alongside finished work
- **Quiet appreciation** — a single "save" action (like a bookmark), not likes/hearts/claps
- **Direct messages between artists and collectors** — but only when a collection relationship exists (prevents spam)

**What's noise (not building):**
- Comments sections
- Public follower/following counts
- Activity feeds ("X collected Y")
- Social sharing prompts
- Notifications beyond the essential (someone collected your work, a curator featured you)

---

## 3. The Canvas — How Art Lives on the Platform

### Display Philosophy

Generative art is a **living medium**. A piece is not an image file — it's code that produces visual output. Ergon treats the algorithm as the artwork and each render as a performance.

- **Gallery mode**: pieces are displayed as high-quality preview renders in the curated grid. These are pre-rendered thumbnails (WebP/AVIF) generated from the artist's chosen preview seed(s).
- **Immersive mode**: pieces render **live in the browser**. The algorithm runs in real-time. If it's animated, it animates. If it responds to mouse position, it responds. The piece is alive.
- **Profile/collection views**: thumbnail grid with hover-to-animate (the piece starts rendering on hover, returns to static preview on leave).

### The Algorithm vs. The Output

This is the fundamental tension in generative art. Ergon's position:

- **The algorithm is the artwork.** It's what the artist created.
- **Each output is a unique expression** of that artwork, determined by its seed (and potentially by viewer interaction).
- When someone collects, they collect **a specific output** (seed) but the algorithm remains the artist's.
- The algorithm source code is **visible by default** (artists can opt out). This is a cultural choice — generative art has a tradition of openness and the code itself is part of the work.

### Interactivity

Three levels, chosen by the artist:

1. **Static** — the piece renders once from its seed. A still image, but rendered live (so it can be high-resolution, responsive to viewport).
2. **Animated** — the piece has a time dimension. It loops, evolves, or runs continuously.
3. **Interactive** — the piece responds to viewer input (mouse, touch, keyboard, device orientation). The viewer becomes part of the work.

### Supported Formats

**Phase 1 (MVP):**
- **p5.js** — the most accessible creative coding framework, largest community
- **Canvas API** — raw 2D canvas for artists who want lower-level control
- **SVG** — for vector/geometric work

**Phase 2:**
- **three.js** — 3D generative work
- **GLSL shaders** — fragment/vertex shaders for GPU-driven work
- **Custom engines** — any JavaScript that renders to a canvas element

**The contract**: every piece must expose a `<canvas>` or `<svg>` element as its output surface. The platform handles framing, scaling, and capture. The artist handles what goes on the canvas.

### Sandboxing

Art code runs in a **sandboxed iframe** with:
- No network access (can't phone home or load external resources beyond declared dependencies)
- No access to parent page DOM
- Declared dependency allowlist (p5.js, three.js, etc. loaded from Ergon's CDN)
- Memory and CPU limits (kill switch if a piece hangs or leaks)
- CSP headers restricting execution scope

This protects viewers from malicious code while giving artists creative freedom within the canvas.

### Live Editor / Sandbox

The studio IS the sandbox. Artists develop directly in Ergon's environment. There's no separate "upload your code" flow — you create it here. However, for advanced artists who prefer their own editor:

- **Import from URL** — paste a CodePen/Observable/GitHub URL and Ergon will attempt to import
- **Paste code** — drop raw p5.js code into the editor
- **CLI tool** (Phase 2) — `ergon push` from local development environment

---

## 4. Design System & UX Philosophy

### Overarching Principle

**The platform is the frame. The art is the painting.** Every design decision serves one goal: make the art look incredible and get everything else out of the way.

This means:
- The UI is **monochrome** (black, white, grays) so it never clashes with artwork
- Typography is **strong but restrained** — it creates hierarchy without shouting
- Whitespace is **structural** — it's not "empty space," it's the architecture of the page
- Interactions are **precise and deliberate** — no bouncy animations, no playful transitions (except the signature gallery→immersive transition, which is cinematic)

### Typography

**Primary typeface: A grotesque sans-serif.**
Candidates: Neue Haas Grotesk (if licensing works), ABC Diatype, Söhne, or GT America. The typeface should feel Swiss/modernist but not cold — technically precise with just enough warmth.

**Hierarchy:**
- **Display** — ALL CAPS, tight tracking, used sparingly (page titles, exhibition names)
- **Headings** — Sentence case, medium weight, generous size
- **Body** — Regular weight, comfortable reading size (16-18px), generous line height (1.5-1.6)
- **Captions/metadata** — Small caps or reduced size, used for dates, dimensions, edition info
- **Code** — Monospace (JetBrains Mono, Berkeley Mono, or IBM Plex Mono) for the studio editor

**Typographic rules:**
- Never more than two weights visible on a single view
- Tracking opens up as size increases (display type is tracked out, body is normal)
- No italic unless quoting something
- Numbers are tabular (monospaced) in metadata contexts

### Color Philosophy

**Platform palette:**
- **Background**: `#FFFFFF` (primary), `#FAFAFA` (secondary surfaces), `#000000` (inverted for immersive mode)
- **Text**: `#000000` (primary), `#666666` (secondary), `#999999` (tertiary/disabled)
- **Accent**: One single accent color used extremely sparingly — only for actionable elements. A warm, slightly muted red (`#C4362C` range) or a deep blue. Never both.
- **Borders/dividers**: `#E5E5E5` — visible but quiet

**The platform is achromatic.** Color belongs to the art, not to the UI. When a page displays a piece with vivid blues and oranges, the monochrome UI doesn't compete — it frames.

**Immersive mode inverts**: black background, white text (on hover overlay). The art floats in darkness.

### Key Views & Flow

```
┌─────────────────────────────────────────────┐
│  HOME                                        │
│  Current exhibition + featured works          │
│  ↓                                           │
├─────────────┬───────────────┬───────────────┤
│  GALLERY    │  STUDIO       │  PROFILE      │
│  Browse     │  Create       │  Your works   │
│  exhibitions│  (the editor) │  Collections  │
│  & artists  │               │  Settings     │
│  ↓          │               │               │
│  IMMERSIVE  │               │               │
│  Full-bleed │               │               │
│  art view   │               │               │
└─────────────┴───────────────┴───────────────┘
```

**Navigation**: Top bar, minimal. Logo left, three items right: Gallery, Studio, Profile (avatar). No hamburger menus. No sidebars. The navigation is always visible but never dominant.

**Home**: Not a feed. A single curated exhibition presented cinematically — one hero piece full-width, then a considered selection of featured works below. Updated weekly/biweekly. Think: the front page of a well-designed magazine, not a social media timeline.

**Gallery**: Grid of exhibitions and works. Filter by technique, format, or nothing (just browse). Each row is intentionally composed, not auto-flowed. The grid has rhythm — large pieces anchor sections, smaller pieces cluster.

**Studio**: The hybrid editor. Full viewport. The canvas dominates, parameters panel on the right (collapsible), code editor pulls up from the bottom. Dark UI in the studio (inverse of the gallery) — because artists stare at this for hours and dark reduces eye strain.

**Artist pages**: Clean portfolio layout. Header with name, bio. Grid of works below. No metrics visible to visitors. The work speaks.

**Immersive mode**: No UI. Just the piece. Hover reveals a minimal overlay with title, artist, and actions. Escape returns to the gallery with the reverse transition.

### The Signature Transition

The gallery→immersive transition is the single most important interaction to get right:

1. User clicks a piece in the grid
2. The surrounding grid items fade and slide away
3. The clicked piece smoothly scales and repositions to fill the viewport
4. Background transitions from white to black
5. The piece begins rendering live (swapping from thumbnail to live canvas)
6. Chrome fades in after a beat (title, artist, actions)

This should take ~600-800ms. It should feel physical — like a gallery wall sliding open to reveal a room behind it. Use `View Transitions API` where supported, fall back to FLIP animations.

### Spacing System

8px base unit. All spacing is multiples of 8:
- `4px` — micro (between inline elements)
- `8px` — tight (within components)
- `16px` — default (between related elements)
- `24px` — comfortable (between sections within a view)
- `48px` — spacious (between major sections)
- `96px` — dramatic (page-level breathing room, above-fold spacing)

**Rule: when in doubt, add more space, not less.** Density is the enemy of art presentation.

---

## 5. Technical Architecture

### Frontend Stack

**Core:**
- **Next.js 14+** (App Router) — SSR for gallery/SEO, CSR for studio
- **Tailwind CSS** — utility-first, maps cleanly to the spacing system
- **TypeScript** — non-negotiable for a project of this complexity

**Key libraries:**
- **Zustand** — lightweight state management for studio state (parameters, code, preview)
- **CodeMirror 6** — the code editor in the studio (extensible, performant, mobile-friendly)
- **Monaco** is the alternative but heavier — CodeMirror is better for this use case
- **Framer Motion** — for the signature transition and micro-interactions
- **Remotion** (Phase 2) — video export of animated pieces

### Art Rendering Architecture

```
┌──────────────────────────────────────┐
│  Ergon Platform (parent page)         │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Sandboxed iframe             │    │
│  │  ┌────────────────────────┐  │    │
│  │  │  Art runtime             │  │    │
│  │  │  - Loads declared deps   │  │    │
│  │  │  - Executes artist code  │  │    │
│  │  │  - Renders to <canvas>   │  │    │
│  │  │  - Exposes parameter API │  │    │
│  │  └────────────────────────┘  │    │
│  │  Communication: postMessage   │    │
│  └──────────────────────────────┘    │
│                                      │
│  Parameter controls ←→ postMessage    │
│  Thumbnail capture ← canvas.toBlob() │
└──────────────────────────────────────┘
```

**How it works:**
1. Each piece runs in a sandboxed `<iframe>` with strict CSP
2. The iframe loads an Ergon runtime that bootstraps the art environment
3. Artist code executes within the runtime's sandbox
4. Parameters flow from parent → iframe via `postMessage`
5. Canvas output flows from iframe → parent for thumbnail capture
6. The runtime handles frame rate limiting, memory monitoring, and graceful teardown

**Pre-rendered thumbnails:**
- When an artist publishes, the platform renders N preview images from the artist's chosen seed(s)
- Thumbnails stored as WebP/AVIF at multiple resolutions (300px, 600px, 1200px)
- Used in gallery grid, search results, social sharing (Open Graph images)
- The gallery never renders live art — only thumbnails. Live rendering happens only in immersive mode and the studio.

### Storage & Hosting

**Art code:**
- Stored as versioned source in a database (Postgres)
- Each publish creates an immutable version
- Code is served from CDN (bundled with runtime) for fast loading

**Art assets (thumbnails, high-res renders):**
- Object storage (S3-compatible: AWS S3, Cloudflare R2, or Backblaze B2)
- R2 is the cost-optimal choice (free egress)
- Served via CDN (Cloudflare)

**Dependencies (p5.js, three.js, etc.):**
- Pinned versions hosted on Ergon's CDN
- Artists declare which dependencies they need
- No loading from external CDNs (security + reliability)

### Auth & Profiles

**Build, don't buy** the profile system — it's too core to the product identity to delegate:
- Auth: **NextAuth.js** with email magic links (primary) + OAuth (GitHub, Google)
- Crypto wallet connection (optional): WalletConnect / RainbowKit
- Profiles stored in Postgres
- Sessions via JWT with httpOnly cookies

### Database

**PostgreSQL** via **Prisma** ORM:
- Users, profiles, works, editions, collections, exhibitions
- JSONB for flexible metadata (parameters schema, exhibition config)
- Full-text search for discovery (Postgres native, upgrade to Typesense/Meilisearch if needed)

### API Design

**tRPC** or **Next.js Server Actions** — skip REST for internal APIs:
- Type-safe end-to-end
- No API documentation to maintain
- Server Actions for mutations (publish, collect, update profile)
- tRPC for complex queries if needed

**Public API (Phase 2):**
- REST or GraphQL for third-party integrations
- Embed API: allow artists to embed their pieces on external sites

### Payments

- **Stripe** for traditional payments (Stripe Connect for artist payouts)
- **Crypto payments (Phase 2)**: integrate with a payment processor that handles ETH/USDC, converts to fiat for artists who prefer it

### Infrastructure

- **Vercel** for hosting (natural fit for Next.js, handles edge rendering)
- **Cloudflare R2** for asset storage
- **PlanetScale** or **Supabase** for managed Postgres
- **Upstash** for rate limiting and ephemeral state

---

## 6. Business Model

### The Bandcamp Model

**Studio is free. Always. No tiers. No gates.**

Every artist gets:
- Full studio access (visual layer + code editor)
- Unlimited works in progress
- Unlimited published works
- Artist profile page
- All templates and learning resources

**Revenue: transaction cut on sales.**
- When a collector purchases a piece, Ergon takes **15%** (Bandcamp takes 15% on digital, 10% on merch)
- Artist receives **85%** directly via Stripe Connect
- If crypto: same split, enforced by smart contract or platform escrow

### Why This Works

- **Zero barrier to create.** Your target audience is artists who are intimidated by existing tools. Any paywall is a second wall.
- **Revenue aligned with artist success.** Ergon only makes money when artists make money. This creates the right incentive: make the tools so good that artists create work worth buying.
- **No pressure to enshittify.** No investors demanding monthly recurring revenue. No pressure to add premium tiers that fracture the community. The platform stays simple because simple is the business model.
- **Bandcamp proved this works.** They built a $50M+/year business on this model before the Epic acquisition. The generative art market is smaller but the economics are similar.

### Revenue Projections (Rough)

- 50 active artists, average 2 editions each, average price $50, average 10 collectors per edition
- = 1,000 transactions × $50 × 15% = **$7,500**
- That's not a business yet. But at 500 artists with similar metrics: **$75,000**
- At 2,000 artists with higher average prices (generative art sells for $100-500+): **$300K-1.5M**
- The model scales with community growth and art market maturation

### What Ergon Will Never Do

- Charge artists to publish
- Show ads
- Sell user data
- Take more than 15%
- Add premium tiers that gate creative features
- Optimize for engagement metrics

---

## 7. MVP Definition

### The 50-Artist Test

The MVP is compelling enough to attract **50 serious generative artists** who actively publish work. Not 50 signups — 50 people making and sharing work.

### What's In MVP (90-Day Build)

#### Month 1: The Studio
- Hybrid editor with visual parameter layer + code editor
- p5.js support (single framework to start)
- 10 curated templates spanning key techniques (noise, particles, geometry, color)
- Live preview canvas
- Parameter ↔ code sync
- Sandboxed rendering (iframe)
- Save/load works (draft state)

#### Month 2: Publishing & Gallery
- Publish flow (title, description, preview generation)
- Artist profile pages
- Gallery view with curated grid
- Immersive mode with the signature transition
- Auth (email magic links)
- Thumbnail generation pipeline
- Basic search

#### Month 3: Collecting & Polish
- Stripe integration (collect/purchase flow)
- Edition models (open, limited, unique, free)
- Collector profiles and collection pages
- Home page with curated exhibition
- Mobile responsive (gallery + immersive, not studio)
- Performance optimization
- Invite 50 artists for closed beta

### What's Cut From V1

- **Crypto/wallet integration** — add after product-market fit, not before
- **Three.js / GLSL / custom engines** — p5.js only for MVP
- **AI assistance in editor** — the visual layer IS the accessibility feature for v1
- **Community features** — no comments, no follows, no activity feeds
- **Collections as curation** — collectors get a simple list, not Are.na-style channels
- **Process sharing** — artists get a profile, not a blog
- **Custom domains** — `artist.ergon.art` subdomains come later
- **Public API / embed** — internal only for v1
- **Video export** — Remotion integration comes in Phase 2
- **CLI tool** — paste code or use the studio for v1
- **Import from URL** — manual paste only for v1
- **Editorial content** — no artist spotlights or written features in v1, just curated exhibitions
- **Mobile studio** — the editor is desktop-only; gallery/immersive are responsive

### 90-Day Build Plan

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1-2 | Studio foundation | Code editor (CodeMirror), canvas rendering, iframe sandbox |
| 3-4 | Visual parameter layer | Parameter controls, bidirectional sync with code, live preview |
| 5-6 | Templates + art runtime | 10 p5.js templates, Ergon runtime API, dependency loading |
| 7-8 | Auth + data model | NextAuth, Postgres schema, user profiles, work CRUD |
| 9-10 | Publishing + gallery | Publish flow, thumbnail generation, gallery grid, artist pages |
| 11-12 | Immersive mode + transition | Full-bleed art view, signature transition, mobile gallery |
| 13 | Collecting + payments | Stripe Connect, edition models, collector profiles |
| 14 | Polish + beta | Home page, performance, bug fixes, invite 50 artists |

### The Non-Negotiables

These are the things that must be excellent in v1, not just functional:

1. **The studio must feel magic on first use.** Pick a template, move a slider, see something beautiful happen. Under 3 seconds from "I want to try this" to "whoa."
2. **The signature transition must be cinematic.** This is the moment people screenshot and share. It has to feel like nothing else on the web.
3. **The typography and spacing must be impeccable.** If the platform doesn't feel like a design artifact, you've failed the premise.
4. **Art must render fast and look sharp.** No loading spinners in immersive mode. No blurry canvases. No jank.

---

## Appendix: Open Questions

These decisions can be deferred but should be revisited before Phase 2:

1. **Curation governance** — who curates the gallery? Just you? An invited panel? Community-nominated? This shapes the platform's cultural authority.
2. **Algorithm visibility** — should code be visible by default? The creative coding community leans open, but some artists will want to protect their techniques.
3. **Royalties on resale** — if a collector resells, does the artist get a cut? Easy with crypto (ERC-2981), harder with traditional payments.
4. **Content moderation** — generative art can produce unexpected outputs. What's the policy when an algorithm occasionally generates something problematic?
5. **Attribution on forks** — if someone forks a template and publishes a derivative, how does attribution work? What's original enough to be "yours"?
6. **International payments** — Stripe Connect has geographic limitations. How do you serve artists in countries Stripe doesn't support?
