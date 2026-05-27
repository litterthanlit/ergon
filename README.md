# Ergon

Ergon is a browser-native visual creation tool inspired by TouchDesigner: live GPU visuals, operator graphs, recipes, parameter controls, and published works that stay interactive.

## Current Architecture

- `src/app/studio/page.tsx` opens `TextureStudio`, the current graph-based texture editor.
- `src/lib/texture-patch.ts` defines TOP-style operators, recipes, validation, and render plans.
- `src/lib/texture-runtime.ts` renders texture patches with WebGL2.
- `src/lib/work-document.ts` defines the canonical saved work format.
- Published works are engine-aware:
  - `texture-patch` renders with the texture runtime.
  - `p5-sketch` renders in the legacy sandbox iframe.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional Supabase env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Without Supabase, the studio runs in demo mode but save/publish is disabled.

## Publishing Model

Works now use a versioned document contract:

- `engine`
- `document_version`
- `document`
- `thumbnail_url`

Old `code`, `template_id`, and `params` columns remain as compatibility fallbacks. This keeps old p5 sketches readable while making texture patches first-class.

Apply `docs/supabase-phase-0.sql` before relying on save/publish in a real Supabase project.

## Useful Commands

```bash
npm test
npm run lint
npm run build
npm run build:runtime
```

## Known Limits

- WebGPU is not implemented; the texture renderer is WebGL2.
- User-authored JS still belongs in the sandbox path.
- Play Mode, command history, control nodes, shader editing, and gamified onboarding are future phases.
