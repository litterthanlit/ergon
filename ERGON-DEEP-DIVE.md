# Ergon — Deep Dive: The Hard Problems

> Companion to `ERGON-SPEC.md`. Building-level specificity on the seven areas that matter most.

---

## 1. First-Run Experience: The First 60 Seconds

### The GarageBand Insight

GarageBand doesn't show you a DAW. It shows you a piano you can play. The "whoa" moment happens before you understand what you're doing. Ergon needs the same: you should change art before you understand how.

### The Flow

**Second 0 — Click "Open Studio"**

You do NOT see:
- A blank canvas
- A code editor
- A template picker grid
- A tutorial modal

You DO see: **a full-screen generative piece, already running, already beautiful.** A flow field with particles drifting across the screen. It's alive, moving, mesmerizing. This is Drift (template #1) running at full bleed.

The studio chrome is minimal: a dark translucent strip at the bottom with the Ergon wordmark. Nothing else competes with the art.

**Seconds 3-5 — The Invitation**

After a brief pause (let them watch), three floating controls fade in on the right side of the canvas. Not a panel — floating, semi-transparent, directly on top of the art:

```
○─────────● Density        [slider at 40%]
○───●─────── Speed          [slider at 25%]
○────────●── Color          [slider at 70%]
```

A single line of text fades in above them: **"Move a slider."**

Not "Welcome to Ergon!" Not "Let's get started!" Not a paragraph of explanation. Three words.

**Seconds 5-15 — The "Whoa" Moment**

The user moves the Density slider. The particle count visibly increases — the sparse field becomes a dense river of motion. The change is immediate, dramatic, and beautiful.

This is the moment. They just changed generative art with their hand. No code. No understanding required. Just cause and effect.

They try Speed. The particles accelerate or slow to a crawl. They try Color. The palette shifts from cool blues to warm oranges.

They're already making aesthetic decisions. They're already an artist using this tool.

**Seconds 15-30 — Expanding Control**

After they've moved at least two sliders, a subtle "+" appears below the controls. Tapping it reveals 2-3 more parameters that were hidden (noise scale, trail length, background opacity). The tool reveals complexity gradually.

At the bottom of the controls: **"Try another starting point →"**

This opens a horizontal strip of 4 more template thumbnails at the bottom of the screen. Each is a small live-rendering preview (not static). Tap one and the canvas crossfades to the new template. The parameter controls update to match.

**Seconds 30-60 — The Bridge to Code**

After exploring at least one template switch, a small tab appears at the bottom of the canvas: **"See the code ↑"**

Pull it up and the code editor slides in from the bottom, taking the lower third of the screen. The code is visible, syntax-highlighted, and SHORT (25-35 lines). The parameter declarations are highlighted with a subtle background color that matches the slider colors on the right.

The user sees: the slider labeled "Density" corresponds to `count: { min: 100, max: 10000, default: 500 }` in the code. The connection is visual and immediate.

They don't have to do anything with the code. But it's there. And it's not scary because they already understand what it does — they've been controlling it for 45 seconds.

### What This Flow Gets Right

1. **No decisions before experience.** Template selection comes AFTER the user has already interacted with one. They have context for choosing.
2. **The first action is physical, not cognitive.** Moving a slider is a motor action with immediate visual feedback. It doesn't require reading or understanding.
3. **Complexity is revealed, not presented.** Three sliders → more sliders → template switching → code. Each layer appears only after the previous one has been explored.
4. **The art is always the main character.** At no point does UI dominate the canvas. The controls float on top, translucent.

### What to Study

- **GarageBand's instrument picker** — immediate sound on touch, no setup
- **Figma's first-run** — drops you into a canvas with a pre-built frame, not a blank page
- **tldraw** — zero onboarding, you're drawing in 1 second
- **Strudel (strudel.cc)** — live coding music environment with immediate audio feedback. The closest precedent to what Ergon's studio should feel like.

---

## 2. The Signature Transition: Technical Deep Dive

### Forward Transition (Gallery → Immersive)

Total duration: **800ms**. Five overlapping phases.

```
Timeline (ms)
0        200        400        600        800
|---------|---------|---------|---------|
[Phase 1: Grid fades          ]
    [Phase 2: Piece expands              ]
      [Phase 3: Background darkens        ]
            [Phase 4: Canvas swap     ]
                          [Phase 5: Chrome fades in]
```

**Phase 1 — Grid Dissolution (0–300ms)**

The surrounding grid items (everything except the clicked piece) fade out and scale down slightly:
- `opacity`: 1 → 0
- `scale`: 1 → 0.97
- `filter`: none → `blur(2px)` (subtle, sells the depth shift)
- Easing: `ease-out` (fast start, gentle finish)
- Stagger: items further from the clicked piece fade slightly later (30ms stagger per ring of distance). This creates a ripple effect emanating from the click point.

**Phase 2 — Piece Expansion (100–650ms)**

The clicked piece expands from its grid position to fill the viewport. This is the hero animation.

Implementation: **FLIP technique.**
1. On click, measure the piece's current `getBoundingClientRect()` (First)
2. Apply `position: fixed; inset: 0; width: 100vw; height: 100vh;` (Last)
3. Calculate the transform delta (Invert)
4. Apply the inverted transform, then animate to `transform: none` (Play)

Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — this is a modified expo-out. Fast departure from the grid position, decelerating smoothly into full-screen. The piece should feel like it's being pulled toward the viewer.

The piece maintains its aspect ratio during expansion. If the art is square and the viewport is wide, black bars appear on the sides (cinematic, intentional — like letterboxing).

**Phase 3 — Background Transition (200–600ms)**

A full-screen `<div>` behind the expanding piece fades from transparent to `#000000`:
- `opacity`: 0 → 1
- Easing: `ease-in-out`
- This div is positioned between the fading grid and the expanding piece in z-order

**Phase 4 — Thumbnail-to-Canvas Swap (400–600ms)**

This is the hardest part. The user should never see a loading state, a flash, or a pop.

**Strategy: pre-warm on hover.**

1. When the user hovers over a piece in the gallery, start loading the iframe in a hidden container (`opacity: 0; position: absolute; pointer-events: none`). The iframe begins executing the art code.
2. On click, the iframe has had 300ms+ head start (average hover-to-click time).
3. During expansion (Phase 2), the thumbnail `<img>` is the visible layer. The iframe renders behind it.
4. At 400ms into the transition (piece is ~70% expanded), check if the iframe has rendered at least one frame:
   - **If yes:** Cross-fade thumbnail → canvas. `img` opacity 1→0 over 200ms. The art becomes alive mid-transition. This is magical.
   - **If no (slow connection):** Keep the thumbnail. Complete the expansion. Show the thumbnail at full-bleed. When the canvas is ready, do a separate 300ms cross-fade. The user sees the piece "wake up" — a still image that starts breathing. This is still beautiful, just a different kind of beautiful.
5. For mobile or no-hover contexts: start iframe loading on click. The thumbnail expansion buys ~500ms of loading time. Same conditional swap logic.

**Canvas readiness detection:**
```javascript
// In the iframe's runtime
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// After first draw() call completes:
window.parent.postMessage({ type: 'ergon:ready' }, '*');
```

**Phase 5 — Chrome Fade-In (650–800ms)**

After the piece reaches full-screen and the canvas is live, the overlay UI fades in:
- Title and artist name: slide up 12px + fade in, 150ms, `ease-out`
- Action buttons (collect, share, close): fade in, 150ms, 50ms delay after title
- Position: bottom of viewport, centered or left-aligned
- Background: `linear-gradient(transparent, rgba(0,0,0,0.6))` — a vignette that makes text readable without a solid bar

### Reverse Transition (Immersive → Gallery)

**Not the inverse.** The forward transition is an event — dramatic, cinematic, 800ms. The reverse is a retreat — quick, clean, 400ms.

```
Timeline (ms)
0        100        200        300        400
|---------|---------|---------|---------|
[Chrome out  ]
[Canvas → thumb ]
  [Piece shrinks                        ]
    [Background lightens                ]
        [Grid fades in                  ]
```

**Phase 1 (0–100ms):** Chrome fades out immediately. The art is briefly alone on black.

**Phase 2 (0–150ms):** Canvas swaps back to thumbnail (instant swap, no cross-fade — the reverse doesn't need to be graceful here, the piece is shrinking rapidly).

**Phase 3 (50–350ms):** Piece shrinks back to its grid position (FLIP reverse). Easing: `cubic-bezier(0.32, 0, 0.67, 0)` — expo-in, accelerating into the grid. It feels like the piece is being placed back.

**Phase 4 (100–350ms):** Background fades black → white.

**Phase 5 (200–400ms):** Grid items fade back in. No stagger (keeping it fast). `opacity` 0 → 1, `scale` 0.97 → 1.

The asymmetry is intentional. Entering is slow and cinematic (you're stepping into a room). Leaving is fast and decisive (you're turning around and walking out).

### Graceful Degradation

**`prefers-reduced-motion: reduce`:**
- No animation. Instant cut: grid view disappears, immersive view appears.
- Thumbnail swaps to canvas without choreography (simple image replacement).
- Reverse: instant cut back.

**Low-end devices (detected via `navigator.hardwareConcurrency <= 2` or `navigator.deviceMemory <= 2`):**
- Simplified transition: skip the grid dissolution (just fade the whole page), expand the piece with a basic ease, skip the pre-warm (load canvas after transition).
- Duration: 400ms instead of 800ms.

**No View Transitions API support:**
- The entire implementation above uses FLIP + CSS transforms + `requestAnimationFrame`. No dependency on View Transitions API.
- View Transitions API can be used as a progressive enhancement for browsers that support it (cleaner z-ordering, native cross-fade), but the FLIP implementation is the baseline.

### What to Study

- **Paul Lewis — FLIP technique**: The foundational pattern. [aerotwist.com/blog/flip-your-animations/]
- **View Transitions API**: Chrome 111+. Study the spec but don't depend on it.
- **Barba.js**: Page transition library. Study its choreography model, not its code.
- **Apple TV+ app**: Show artwork → full-screen playback. The closest consumer product reference.
- **Linear's issue detail transition**: Panel expands from list. Precise, spatial, fast. Study the easing.
- **Framer Motion's `layoutId`**: Shared layout animations. This is essentially FLIP with a nice API. If you're using Framer Motion (recommended in spec), this handles most of Phase 2.

### Implementation Recommendation

Use **Framer Motion's `AnimatePresence` + `layoutId`** for Phase 2 (piece expansion). This gives you FLIP-based layout animation with a one-line API. Handle Phases 1, 3, 4, 5 with manual CSS transitions coordinated via `requestAnimationFrame` and `setTimeout`. Don't try to orchestrate everything through a single animation library — the phases have different concerns.

---

## 3. Template Design Philosophy

### What Makes a Great Ergon Template

A template is doing **four jobs simultaneously**:

1. **First impression** — "Generative art can look like THIS?" The template must be visually striking in its default state.
2. **Interaction hook** — "I made it do THAT." Every parameter must produce a visible, satisfying change. No subtle tweaks — dramatic transformations.
3. **Concept teacher** — "Oh, THAT's how noise works." Each template introduces one core generative concept through direct manipulation.
4. **Creative launchpad** — "What if I changed..." The template should provoke curiosity about what's possible beyond the exposed parameters.

### Template Criteria

| Criterion | Test |
|---|---|
| **Beautiful at default** | Would you put a screenshot of the default output on the landing page? |
| **Dramatic response** | Does moving any single slider from min to max produce a clearly different piece? |
| **One concept** | Can you explain the core technique in one sentence? |
| **Short code** | Is the core logic under 40 lines? (Total with params/setup can be longer) |
| **3-5 parameters** | Enough to explore, few enough to not overwhelm. Each parameter must be independent — changing one shouldn't require adjusting others. |
| **No boilerplate** | The template hides p5.js ceremony. No `createCanvas()` — the runtime handles that. The code starts at the interesting part. |

### The MVP Five

#### 1. Drift — Flow Fields

**What it teaches:** Noise-based movement. The most fundamental generative concept.

**Why it's first:** Flow fields are the "Hello World" of generative art — immediately recognizable, endlessly variable, and they produce the kind of output that makes people say "I want to learn how to make that." This is the template running when you first open the studio.

**Default state:** Thousands of white particles flowing in smooth curves across a dark blue-black background. Organic, calming, alive.

**Parameters:**
| Parameter | Type | Range | Default | What it does visibly |
|---|---|---|---|---|
| Density | Slider | 100–10,000 | 2,000 | Sparse wisps → dense rivers of motion |
| Speed | Slider | 0.2–5.0 | 1.0 | Frozen stillness → rushing current |
| Turbulence | Slider | 0.001–0.02 | 0.005 | Smooth laminar flow → chaotic swirls |
| Color | Palette picker | 6 presets | "Arctic" | Entire mood shifts — cool/warm/mono/neon |
| Trail | Slider | 1–80 | 20 | Dots → long flowing streaks |

**Core code (~30 lines):**
```javascript
const particles = Array.from({ length: params.density }, () => ({
  x: random(width), y: random(height),
}));

function draw() {
  background(0, 0, 12, 100 - params.trail);
  for (const p of particles) {
    const angle = noise(p.x * params.turbulence, p.y * params.turbulence) * TWO_PI * 2;
    p.x += cos(angle) * params.speed;
    p.y += sin(angle) * params.speed;
    point(p.x, p.y);
    // wrap edges
    if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
  }
}
```

---

#### 2. Grid — Geometric Composition

**What it teaches:** Repetition with variation. How simple rules create complex patterns.

**Why it's here:** Connects directly to the design world — these outputs look like Swiss posters. For your target audience (artists, designers), this is instantly familiar territory made surprising.

**Default state:** A 12×12 grid of black squares on white, each rotated by a random amount. Looks like a Karl Gerstner piece.

**Parameters:**
| Parameter | Type | Range | Default | What it does visibly |
|---|---|---|---|---|
| Columns | Slider | 3–32 | 12 | Few large cells → many tiny cells |
| Rotation | Slider | 0–180° | 45° | No rotation → maximum chaos |
| Density | Slider | 0.0–1.0 | 0.8 | Sparse → full grid |
| Shape | Selector | Circle / Square / Line | Square | Entirely different aesthetic per shape |
| Invert | Toggle | On/Off | Off | Black on white ↔ white on black |

**Core code (~20 lines):**
```javascript
function draw() {
  background(params.invert ? 0 : 255);
  fill(params.invert ? 255 : 0);
  noStroke();
  const size = width / params.columns;
  for (let x = 0; x < params.columns; x++) {
    for (let y = 0; y < params.columns; y++) {
      if (random() > params.density) continue;
      push();
      translate(x * size + size / 2, y * size + size / 2);
      rotate(random(-params.rotation, params.rotation) * PI / 180);
      if (params.shape === 'circle') ellipse(0, 0, size * 0.8);
      else if (params.shape === 'line') rect(-size * 0.4, -1, size * 0.8, 2);
      else rect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
      pop();
    }
  }
  noLoop();
}
```

---

#### 3. Pulse — Animated Oscillation

**What it teaches:** Time as a creative variable. How `sin()` and `frameCount` create rhythm.

**Why it's here:** It's the first animated template that feels like it's breathing. Teaches that generative art isn't just static images — it can have tempo, rhythm, pulse. The output is hypnotic and shareable.

**Default state:** Concentric rings expanding and contracting in a breathing rhythm. Monochrome with a subtle gradient.

**Parameters:**
| Parameter | Type | Range | Default | What it does visibly |
|---|---|---|---|---|
| Rings | Slider | 3–30 | 12 | Few thick rings → many thin rings |
| Tempo | Slider | 0.2–4.0 | 1.0 | Slow breathing → rapid pulsing |
| Amplitude | Slider | 5–120 | 40 | Subtle wobble → dramatic expansion |
| Color Shift | Slider | 0–360° | 0 | Monochrome → rainbow phase shift |
| Symmetry | Selector | Radial / Horizontal / Diagonal | Radial | Completely different spatial character |

**Core code (~20 lines):**
```javascript
function draw() {
  background(0);
  noFill();
  strokeWeight(2);
  translate(width / 2, height / 2);
  for (let i = 0; i < params.rings; i++) {
    const phase = i / params.rings * TWO_PI;
    const radius = map(i, 0, params.rings, 40, width * 0.45)
      + sin(frameCount * 0.02 * params.tempo + phase) * params.amplitude;
    const hue = (i / params.rings * params.colorShift) % 360;
    stroke(hue, 80, 100);
    ellipse(0, 0, radius * 2);
  }
}
```

---

#### 4. Scatter — Controlled Randomness

**What it teaches:** Constraints on randomness. The difference between "random" and "composed."

**Why it's here:** This is the conceptual breakthrough template. At one extreme, it's noise — random dots. At the other extreme (with overlap rejection), it's a carefully balanced composition. The slider between those states teaches the single most important idea in generative art: *randomness with rules produces beauty*.

**Default state:** ~200 semi-transparent circles of varying sizes, loosely scattered with moderate overlap. Feels like a watercolor experiment.

**Parameters:**
| Parameter | Type | Range | Default | What it does visibly |
|---|---|---|---|---|
| Count | Slider | 5–500 | 200 | Minimal → dense |
| Size Range | Range slider | 5–150px | 10–60px | Uniform → varied |
| Opacity | Slider | 0.05–1.0 | 0.3 | Ghostly layering → solid shapes |
| Spacing | Slider | 0 (overlap)–50px (spread) | 0 | Overlapping chaos → airy composition |
| Palette | Palette picker | 6 presets | "Watercolor" | Cool / warm / mono / pastel / neon / earth |

**Core code (~30 lines):**
```javascript
function draw() {
  background(252);
  noStroke();
  const placed = [];
  let attempts = 0;
  while (placed.length < params.count && attempts < params.count * 10) {
    const x = random(width), y = random(height);
    const r = random(params.sizeMin, params.sizeMax);
    const tooClose = placed.some(p =>
      dist(x, y, p.x, p.y) < (r + p.r) / 2 + params.spacing
    );
    if (!tooClose || params.spacing === 0) {
      const c = palette[floor(random(palette.length))];
      fill(red(c), green(c), blue(c), params.opacity * 255);
      ellipse(x, y, r);
      placed.push({ x, y, r });
    }
    attempts++;
  }
  noLoop();
}
```

---

#### 5. Weave — Recursive Subdivision

**What it teaches:** Recursion as a visual concept. How simple rules create complex structure.

**Why it's here:** The depth slider is the single most magical parameter interaction in the MVP. At depth 1: one rectangle. At depth 2: two rectangles. At depth 6: a Mondrian painting. You can SEE the algorithm thinking. This template also connects to art history — Mondrian, De Stijl, Gerhard Richter's color charts.

**Default state:** A canvas subdivided 5 levels deep, with primary-color fills (red, blue, yellow) and thick black borders. Unmistakably Mondrian-influenced.

**Parameters:**
| Parameter | Type | Range | Default | What it does visibly |
|---|---|---|---|---|
| Depth | Slider | 1–8 | 5 | Single rectangle → intricate composition |
| Split Bias | Slider | 0.0–1.0 | 0.5 | All horizontal → all vertical (0.5 = random) |
| Color Fill | Slider | 0.0–1.0 | 0.3 | All white → fully colored |
| Gap | Slider | 0–12px | 4px | Touching → floating panels |
| Palette | Selector | Mondrian / Pastel / Mono / Earth | Mondrian | Completely different mood |

**Core code (~25 lines):**
```javascript
function subdivide(x, y, w, h, depth) {
  if (depth === 0 || w < 20 || h < 20) {
    fill(random() < params.colorFill ? palette[floor(random(palette.length))] : 255);
    rect(x + params.gap / 2, y + params.gap / 2, w - params.gap, h - params.gap);
    return;
  }
  if (random() < params.splitBias) {
    const split = random(0.3, 0.7) * w;
    subdivide(x, y, split, h, depth - 1);
    subdivide(x + split, y, w - split, h, depth - 1);
  } else {
    const split = random(0.3, 0.7) * h;
    subdivide(x, y, w, split, depth - 1);
    subdivide(x, y + split, w, h - split, depth - 1);
  }
}

function draw() {
  background(255);
  stroke(0); strokeWeight(params.gap > 0 ? 0 : 2);
  noStroke();
  subdivide(0, 0, width, height, params.depth);
  noLoop();
}
```

### Template Presentation

**First run:** NOT a grid. The first template (Drift) is already running full-screen. No selection required.

**Template switcher** (revealed after initial interaction): A horizontal strip at the bottom of the studio canvas. Each template is a small live-rendering thumbnail (~120×80px). Hover enlarges slightly. Click swaps with a cross-fade (300ms).

**Later (when artists browse templates to start a new piece):** A focused gallery view — each template gets a large preview with its name, one-line description, and the concept it teaches. Maximum 2 columns. Not a grid of tiny icons.

---

## 4. Parameter ↔ Code Sync Architecture

### The Hard Truth

**I'm revising the spec's recommendation.** Bidirectional sync is the wrong goal for Ergon. Here's why:

True bidirectional sync (change a slider → code updates; change code → sliders update) requires:
- Real-time AST parsing of arbitrary JavaScript
- Mapping between AST nodes and UI controls
- Handling code restructuring that invalidates bindings
- Resolving conflicts when code edits and slider changes happen simultaneously

SwiftUI Previews, Storybook Controls, and Remotion's input props all punt on this. They use **declared parameters** — the artist/developer explicitly defines what's controllable, and the system generates UI from those declarations. Code changes to the parameter declaration update the UI. Code changes elsewhere don't affect anything.

**Ergon should do the same.** One-directional: declared params → generated controls → injected runtime values.

### The Architecture

```
┌─────────────────────────────────────────────────┐
│  Parameter Declaration (in artist's code)        │
│                                                  │
│  ergon.params({                                  │
│    count: { type: 'number', min: 100, ... },     │
│    speed: { type: 'number', min: 0.2, ... },     │
│  })                                              │
│         │                                        │
│         ▼                                        │
│  ┌─────────────────┐    ┌──────────────────┐    │
│  │ Parameter Panel  │    │ Code Editor       │    │
│  │ (generated UI)   │    │ (CodeMirror 6)    │    │
│  │                  │    │                   │    │
│  │ [Slider: count]──┼──→ │ Value injected    │    │
│  │ [Slider: speed]──┼──→ │ at runtime, NOT   │    │
│  │                  │    │ written into code  │    │
│  └─────────────────┘    └──────────────────┘    │
│         │                        │               │
│         ▼                        ▼               │
│  ┌─────────────────────────────────────────┐    │
│  │ Sandboxed iframe                         │    │
│  │ Runtime receives params via postMessage   │    │
│  │ Art code reads params.count, params.speed │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### How It Works

**Step 1: Artist declares parameters**

```javascript
const params = ergon.params({
  count: {
    type: 'number',
    min: 100,
    max: 10000,
    default: 2000,
    step: 100,
    label: 'Particle Count'
  },
  speed: {
    type: 'number',
    min: 0.2,
    max: 5.0,
    default: 1.0,
    step: 0.1,
    label: 'Speed'
  },
  palette: {
    type: 'select',
    options: ['Arctic', 'Sunset', 'Mono', 'Neon'],
    default: 'Arctic',
    label: 'Color Palette'
  },
  invert: {
    type: 'boolean',
    default: false,
    label: 'Invert Colors'
  }
});
```

`ergon.params()` is provided by the Ergon runtime (loaded in the iframe). It:
1. Returns a reactive object where `params.count` gives the current value
2. Sends the schema to the parent frame via `postMessage`
3. Listens for value updates from the parent frame

**Step 2: Platform generates UI controls**

The parent frame receives the parameter schema and renders:
- `number` → slider with min/max/step
- `select` → dropdown or segmented control
- `boolean` → toggle switch
- `color` → color picker
- `range` → double-ended slider (for min/max pairs)

No custom rendering code needed per template. The schema IS the UI definition.

**Step 3: Values flow at runtime**

When a user moves a slider:
1. Parent frame sends `postMessage({ type: 'ergon:params', values: { count: 5000 } })`
2. Iframe runtime updates the `params` object
3. On next `draw()` call, `params.count` returns 5000
4. Art updates immediately

The code in the editor **does not change** when sliders move. The values are injected at runtime. This is critical — it means the code is always the "source of truth" for logic, and parameters are a separate data layer.

**Step 4: Code edits update the schema**

When the artist edits the `ergon.params({ ... })` block in the code editor:
1. The code is re-sent to the iframe
2. The iframe re-evaluates, `ergon.params()` runs again with the new schema
3. The new schema is sent to the parent frame
4. The parameter panel re-renders with updated controls

If the artist changes `max: 10000` to `max: 50000`, the slider range updates. If they add a new parameter, a new control appears. If they delete one, the control disappears.

### What Happens When Code Is "Too Complex"

It doesn't matter. The parameter system is opt-in and declaration-based:

- If an artist writes complex code with no `ergon.params()` call: no parameter panel. The code editor is the only interface. That's fine — this is an advanced artist who doesn't need sliders.
- If an artist has `ergon.params()` plus lots of additional code: the parameter panel shows only the declared params. The rest of the code is irrelevant to the visual layer.
- The visual layer never tries to "understand" the code. It only reads explicit declarations.

### The Beginner Experience

For beginners (the primary audience), this is invisible complexity. They interact with templates that have pre-built `ergon.params()` blocks. They see sliders. They move sliders. The code, if they look at it, has a clearly labeled params block at the top.

When they're ready to graduate from tweaking to creating:
1. First edit: change a parameter's range or default in the params block
2. Second edit: add a new parameter (copy an existing one, change the name)
3. Third edit: use the new parameter in the draw logic
4. They've just learned the architecture by doing

### Supported Parameter Types

| Type | UI Control | Schema |
|---|---|---|
| `number` | Slider | `{ min, max, default, step, label }` |
| `boolean` | Toggle | `{ default, label }` |
| `select` | Segmented / dropdown | `{ options: [], default, label }` |
| `color` | Color picker | `{ default: '#ff0000', label }` |
| `range` | Dual slider | `{ min, max, defaultMin, defaultMax, step, label }` |
| `vector2` | XY pad | `{ minX, maxX, minY, maxY, default: [x, y], label }` |

Phase 2 additions: `image` (upload), `audio` (microphone input), `curve` (bezier editor).

### Precedents to Study

- **Remotion's `inputProps`** — the closest model. Declared schema, generated controls, runtime injection.
- **Storybook's `argTypes`** — same pattern for component development
- **dat.GUI** — the classic creative coding control panel. Ergon's parameter panel is essentially a productized dat.GUI.
- **Tweakpane** — modern dat.GUI alternative. Study its API design.
- **TouchDesigner's Custom Parameters** — artist-defined controls on nodes. The mental model is identical.

---

## 5. Gallery Curation at MVP Scale

### The Honest Math

At 50 artists publishing ~2 works/week each, you're reviewing ~100 works/week. That sounds like a lot but most reviews are 5-second decisions (glance at the preview, yes/no for feature).

**Time budget: 30–45 minutes per week.** Here's how:

| Task | Time | Frequency |
|---|---|---|
| Review new publishes | 15 min | Weekly scan |
| Select home hero piece | 5 min | Weekly |
| Curate one collection (3-5 pieces) | 10 min | Biweekly |
| Write one-line collection description | 5 min | Biweekly |

That's manageable as a solo operator through 200 artists. Beyond that, you need help.

### Minimum Viable Curation Model

**Home page:**
- One hero piece, full-width, live-rendering. Changed weekly.
- Below: "Recently Published" — chronological, newest first, all works. This is NOT curated. It's the firehose. But because your artists are invite-only in beta, the quality floor is high.

**Gallery page:**
- Tab 1: "Featured" — your curated collections. Start with one, add one every 1-2 weeks.
- Tab 2: "All" — chronological feed of everything.
- Each collection has: a title, a one-line description, and 3-8 pieces.

**That's it for MVP.** No categories, no tags, no search, no filters. When you have 50 artists and 200 works, browsability doesn't require infrastructure — it requires taste.

### Bootstrapping: The Empty Gallery Problem

**With 1-3 pieces:** Don't show a gallery at all. The home page IS the piece. Full-bleed, one work, immersive by default. Below it: "Ergon is a new platform for generative art. [Open Studio]." You're pre-launch. The site is a teaser.

**With 4-10 pieces:** The home page hero + a single row below. Call it "First Works" or simply show them without a label. The scarcity feels intentional, like an opening exhibition with deliberately few pieces.

**With 10-30 pieces:** Now you can curate. Group the best 5-8 into your first collection. The rest live in "All." The home page hero rotates.

**With 30-50 pieces:** Two curated collections + All feed. You're in the groove. This is the beta launch state.

### Key Insight: Invite-Only IS Curation

For beta, you're hand-selecting 50 artists. **That selection IS your curation.** If you invite the right artists, everything they publish is gallery-worthy. The curatorial work is front-loaded into who you invite, not what you feature.

This means: your beta invite list is your most important creative decision. Spend more time on that list than on the gallery UI.

### Migration Path

| Scale | Curation Model | Your Time |
|---|---|---|
| 0-50 artists | You + invite-only quality gate | 30 min/week |
| 50-200 | You + 3 community curators (trusted artists) | 15 min/week (review their picks) |
| 200-500 | Curator applications + editorial oversight | 30 min/week (manage curators) |
| 500+ | Algorithmic "Discover" tab alongside editorial | Same (algorithm handles discovery, you handle editorial) |

The algorithmic tab is a Phase 3+ concern. Don't build recommendation infrastructure until editorial curation physically can't keep up.

---

## 6. Shareability & Growth Loops

### The Core Insight

Every Ergon piece shared externally is a **live demo of the platform**. Unlike Instagram (screenshot), unlike Art Blocks (requires wallet), an Ergon link IS the experience. This is the single biggest growth advantage.

### Shared Link Experience

**URL structure:** `ergon.art/p/[artist]/[piece-slug]`

Example: `ergon.art/p/vera/drift-study-03`

**What happens when you open this link (no account required):**

1. The page loads with a brief shimmer (skeleton of the immersive layout, black background)
2. The piece renders full-bleed. No gallery, no navigation, no signup prompt. Just the art.
3. After 2 seconds, minimal chrome fades in at the bottom: title, artist name, "Open in Ergon" button
4. The viewer can interact with the piece (if interactive), explore seeds (if multi-output)
5. "Open in Ergon" → takes them to the gallery view with this piece as the entry point → shows more work by this artist → invites to create

**The piece IS the landing page.** Don't interrupt the art with a signup modal. Let the work sell the platform.

### Open Graph / Social Cards

When someone pastes an Ergon link into Twitter, Discord, iMessage, Slack:

**Static card (Phase 1):**
- OG image: 1200×630 render of the piece at the artist's chosen seed
- OG title: `"Drift Study 03" — Vera on Ergon`
- OG description: `Generative art. View and interact live.`
- Twitter card type: `summary_large_image`

**Animated card (Phase 2):**
- Generate a 3-second WebP/GIF loop at publish time (15fps, 800×420)
- Use as `og:video` for platforms that support it (Twitter, Discord)
- Fallback to static image for platforms that don't
- This is the difference between someone scrolling past and someone stopping. Animated previews are 3-5× more engaging than static.

**Implementation for Phase 1:**
- Use Vercel's `@vercel/og` for dynamic OG image generation — it runs at the edge, renders React to an image. You can render a frame of the piece server-side using a headless canvas.
- Alternatively: capture a frame via `canvas.toBlob()` at publish time and store it as the OG image. Simpler, no server-side rendering needed.

### Artist Incentive to Share from Ergon

The pitch: **"Your Instagram post is a screenshot. Your Ergon link is the actual artwork."**

Specific advantages:
1. **It's live.** Viewers see the piece running in real-time, not a compressed JPEG.
2. **It's interactive.** If the piece responds to mouse/touch, the link lets people play with it.
3. **It's explorable.** Seed navigation lets viewers see different outputs from the same algorithm.
4. **Professional URL.** `ergon.art/p/vera/drift-study-03` on a portfolio looks better than a Twitter media URL.
5. **Attribution is built in.** The artist's name and profile link are always present. No credit stripping.

### Embed System (Phase 2, but design the URL now)

```html
<iframe
  src="https://ergon.art/embed/[piece-id]?seed=42&responsive=true"
  width="100%" height="500"
  frameborder="0" allowfullscreen>
</iframe>
```

What it does:
- Renders the piece in a sandboxed iframe
- Optional parameters: `seed`, `width`, `height`, `autoplay`, `controls` (show/hide parameter panel)
- A small "Made on Ergon" watermark in the corner (links to the piece page)

**Why this is the best growth loop:** Every artist who embeds a piece on their personal portfolio, their agency's website, or their Medium post is distributing Ergon to their existing audience. The embed is a live advertisement that's also genuinely useful to the artist.

Design the embed URL structure now even if you don't build it until Phase 2. The piece page URL (`/p/[artist]/[slug]`) and the embed URL (`/embed/[piece-id]`) should exist from day one in the routing. When someone asks "can I embed this?", the answer should be "yes, here's the URL" — even if the embed page is just a redirect to the full piece page in Phase 1.

### Growth Strategy Summary

```
Artist creates piece on Ergon
    ↓
Shares link on Twitter/Discord/portfolio
    ↓
Viewer opens link → sees art full-bleed (no friction)
    ↓
Viewer explores → discovers more work on Ergon
    ↓
Viewer becomes:
    → Collector (revenue) or
    → Artist (opens studio, creates, shares... loop repeats)
```

The loop is: **make → share → experience → make**. Every node in this loop should be frictionless.

---

## 7. Revised Timeline: The Honest Build Plan

### The Spec's 90-Day Plan Is Wrong

Here's why: the spec allocates Month 1 to "The Studio" including bidirectional parameter sync, 10 templates, and the sandbox. The parameter architecture alone (even the simplified one-way version) is 2-3 weeks of work. The sandbox is another 2 weeks. 10 templates is another 2 weeks. That's 6-7 weeks before you've built auth or a single page outside the studio.

### Revised Plan: Three Milestones

#### Milestone 1: "Proof of Magic" (30 days → ship to 5 artists)

**The question you're answering:** *"Does the hybrid editor concept work? Do artists actually enjoy making things with this?"*

**What you build:**
- Week 1: Sandboxed iframe + Ergon runtime (loads p5.js, provides `ergon.params()` API, handles `postMessage`)
- Week 2: Parameter panel (reads schema from runtime, renders controls, sends values back). No code editor yet — parameter-only mode.
- Week 3: 3 templates (Drift, Grid, Pulse). Code editor (CodeMirror 6, basic — syntax highlighting, no fancy features). Pull-up panel.
- Week 4: Auth (Supabase — don't roll your own), save/load works, basic artist profile page, publish button that generates a shareable URL.

**What you DON'T build:**
- Gallery view (artists share direct links to their pieces)
- Immersive mode / signature transition
- Collecting / payments
- OG images (just use a static placeholder)
- Multiple templates beyond 3
- Any curation infrastructure

**What it looks like:**
An artist signs up, opens the studio, sees Drift running, plays with sliders, pulls up the code, saves their work, publishes, and gets a link they can share. That link shows the piece full-bleed. That's it.

**How you validate:**
Send it to 5 artist friends. Watch them use it (screen share or session recording). Do they have the "whoa" moment in the first 30 seconds? Do they come back the next day? Do they share their link?

#### Milestone 2: "The Stage" (60 more days → ship to 25 artists)

**The question you're answering:** *"Does the gallery/immersive experience make people want to explore and stay?"*

**What you build:**
- Weeks 5-6: Gallery view (grid layout with curated placement), basic home page (hero + recent)
- Weeks 7-8: The signature transition (gallery → immersive and back). This gets 2 full weeks because it must be perfect.
- Week 9: 2 more templates (Scatter, Weave). Template switcher in studio.
- Week 10: OG image generation (static, canvas.toBlob at publish time). Profile pages with portfolio grid.
- Weeks 11-12: Polish pass — typography, spacing, responsive gallery (mobile), performance optimization.

**What you DON'T build:**
- Collecting / payments
- Crypto anything
- Embed system
- Community features
- Search
- Animated OG previews

#### Milestone 3: "The Market" (30 more days → ship to 50 artists)

**The question you're answering:** *"Will people pay for generative art on this platform?"*

**What you build:**
- Weeks 13-14: Stripe Connect integration, collect/purchase flow, edition models
- Weeks 15-16: Collector profiles, collection pages, home page curation (featured collection), invite remaining artists for closed beta.

**Total: ~120 days (4 months), not 90.**

### Where to Invest Craft vs. Ship Ugly

| Invest Craft (this IS the product) | Ship Ugly (iterate later) |
|---|---|
| First-run experience / "whoa" moment | Auth flow (Supabase default UI is fine) |
| The signature transition | Settings / account pages |
| Typography and spacing everywhere | Admin / curation dashboard (you + a spreadsheet) |
| Studio parameter interaction feel | Profile editing (basic form) |
| Gallery grid composition | Collection display (simple grid) |
| Template quality (code + output) | Email notifications (plain text) |
| Shareable link presentation | Search (not needed until 200+ pieces) |

### What to Fake or Shortcut

1. **Parameter sync:** One-way as described in Section 4. Don't build bidirectional.
2. **Thumbnail generation:** `canvas.toBlob()` triggered by the artist at publish time. No server-side rendering pipeline.
3. **Curation dashboard:** You don't need one. Use the database directly or build a 1-page admin with a list of works and a "feature" toggle.
4. **OG images:** Static screenshots stored in R2. Generate at publish time. Don't build dynamic OG.
5. **Auth:** Supabase Auth with magic links. Don't build custom auth.
6. **Responsive studio:** Desktop only. Don't attempt mobile studio in MVP. Gallery and immersive mode should be responsive; the editor is not.
7. **Template hot-reload:** For v1, template changes require a page refresh. Live HMR in the sandbox is a Phase 2 luxury.
8. **Database migrations:** Use Prisma with a simple Postgres on Supabase. Don't over-engineer the data layer.

### The Single Riskiest Bet

The sandbox + runtime is the foundation everything else sits on. If the iframe architecture is wrong, or the `postMessage` bridge is too slow, or the CSP is too restrictive for p5.js, everything breaks.

**Build the sandbox first.** Week 1. Get a p5.js sketch running in a sandboxed iframe, controlled by `postMessage` parameters, on day 5. If that works, everything else is UI around it. If that doesn't work, you need to know immediately.

---

## Appendix: Decisions Changed From Original Spec

| Spec Said | Deep Dive Says | Why |
|---|---|---|
| Bidirectional parameter ↔ code sync | One-way: declared params → controls → runtime values | Bidirectional is a multi-month engineering project. One-way achieves the same UX for 10% of the effort. |
| 10 templates for MVP | 5 templates (3 for Milestone 1, 2 more for Milestone 2) | Five excellent templates > ten mediocre ones. Each template needs real design attention. |
| 90-day build plan | 120-day plan in 3 milestones | The original was unrealistic for a solo builder. Milestones create validation gates. |
| Monaco or CodeMirror | CodeMirror 6 (firm) | Lighter, more extensible, better mobile story, designed for embedding. Monaco is an IDE; CodeMirror is a component. |
| Custom auth | Supabase Auth | Don't spend time on auth when you could spend it on the studio. Migrate later if needed. |
| 15% transaction cut | Keep 15% but revisit at launch | The deep dive considered 10% but this is a business decision, not a technical one. Test with artists. |
