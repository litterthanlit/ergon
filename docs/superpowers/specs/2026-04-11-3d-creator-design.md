# 3D Creator — World-Class WebGL Renderer

Replaces the 2D canvas `MeshRenderer.tsx` with a cinematic Three.js renderer. The creator becomes Ergon's showpiece — Houdini/TouchDesigner-grade visuals with real-time creative tool interaction feel.

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Visual ambition | World-class: Blender/Houdini/TouchDesigner level | Creator is Ergon's centerpiece — it must look like no other browser tool |
| Performance target | 30-60fps adaptive | Push visuals hard, gracefully degrade on weaker hardware |
| Camera | Parallax default + Alt-key full orbit | Play first, control when you want |
| Post-processing | 7 effects, all toggleable, all default OFF | Clean raw output by default — effects are creative choices |
| Shader approach | Hand-written GLSL from scratch | Maximum control, maximum visual quality |
| Architecture | R3F for scene graph + raw Three.js for shaders | R3F handles plumbing, GLSL handles art |
| Shader organization | Shared core library + bespoke mode shaders | Consistency without constraining creative freedom |
| Render modes | 7 new 3D-native modes replacing the 2D ones | Fluid, Nebula, Crystal, Mycelium, Plasma, Erosion, Flow |
| Mixed media | Auto-generated texture planes + user drag-drop | Magic by default, personal when you want |

## Stack

- `@react-three/fiber` — React scene graph, render loop, canvas management
- `@react-three/drei` — OrbitControls, useTexture, helpers
- `@react-three/postprocessing` — compositor pipeline
- `three` — raw ShaderMaterial, BufferGeometry, custom GLSL
- `detect-gpu` — GPU tier classification for adaptive quality

## File Structure

```
src/components/creator/
├── CreatorPage.tsx          ← swap MeshRenderer for ThreeRenderer
├── DotGrid.tsx              ← unchanged (SVG overlay)
├── MeshRenderer.tsx         ← kept on disk, not imported
├── ThreeRenderer.tsx        ← R3F Canvas + scene composition
├── three/
│   ├── SceneRoot.tsx        ← camera, lights, post-processing, controls
│   ├── MeshGraph.tsx        ← reads store, builds vertex/edge geometry
│   ├── ImagePlanes.tsx      ← auto-generated + user-dropped texture planes
│   ├── ParticleField.tsx    ← global scattered dust particles
│   ├── PostStack.tsx        ← 7 toggleable post-processing effects
│   ├── CameraRig.tsx        ← parallax default + Alt-key orbit mode
│   └── shaders/
│       ├── core.glsl        ← shared: simplex, curl, Worley noise, palette LUT, time uniforms
│       ├── fluid.vert       ← metaball SDF vertex displacement
│       ├── fluid.frag       ← surface tension, caustics, SSS
│       ├── nebula.vert      ← curl noise advection
│       ├── nebula.frag      ← depth fog, volumetric density
│       ├── crystal.vert     ← faceted geometry displacement
│       ├── crystal.frag     ← refraction, prismatic splits
│       ├── mycelium.vert    ← L-system branching
│       ├── mycelium.frag    ← bioluminescence, Fresnel glow
│       ├── plasma.vert      ← arc noise displacement
│       ├── plasma.frag      ← electromagnetic color shifting
│       ├── erosion.vert     ← heightfield displacement
│       ├── erosion.frag     ← sediment, crack rendering
│       ├── flow.vert        ← velocity field particle positioning
│       └── flow.frag        ← trail persistence, velocity color
```

## Scene Graph

```
<Canvas>
  <SceneRoot>
    <CameraRig />
    <ambientLight intensity={0.15} />
    <directionalLight />          ← follows camera
    <MeshGraph mode={renderMode} />
    <ParticleField />             ← always-on ambient dust
    <ImagePlanes />               ← floating texture rectangles
    <PostStack />                 ← cinematic pipeline
  </SceneRoot>
</Canvas>
```

## Render Modes

7 modes, each with hand-written GLSL importing `core.glsl`.

### 1. Fluid

Raymarched signed distance field (SDF) metaballs at each connected vertex. Blobs merge when vertices are close — surface tension pulls them together. Caustic light patterns on the surface via Worley noise. Subsurface scattering approximation for translucent liquid look. Edge connections rendered as fluid bridges (SDF blend between vertex positions). Breathe parameter controls blob pulsation amplitude.

### 2. Nebula

Volumetric raymarching through a 3D curl noise density field. Dense clouds at vertex positions, wispy tendrils along edges. Depth fog with exponential falloff. Stars (bright point sprites) scattered in the background volume. Palette maps to emission color based on density. Breathe controls turbulence intensity, pulse controls swirl speed.

### 3. Crystal

Faceted icosahedron geometry at vertices (low-poly, sharp). Refraction via backface rendering + distortion sampling. Prismatic light splits — rainbow caustics from directional light. Thin beam connections between crystals (volumetric line with glow). Breathe controls facet displacement, pulse controls light rotation.

### 4. Mycelium

Tube geometry grown along edges using cubic Bezier curves. Branching tendrils at vertices (L-system inspired, 2-3 generations). Bioluminescent glow — emission from inside the tubes, Fresnel falloff. Spore particles emitted from branch tips (GPU instanced points). Breathe controls tendril sway, pulse controls growth animation speed.

### 5. Plasma

Electric arcs between connected vertices — jagged polylines with noise displacement. Each arc flickers independently (random intensity per frame). Color shifts along arc length using palette gradient. Corona glow at vertices (billboard sprites with additive blending). Background electromagnetic field lines (curl noise streamlines). Breathe controls arc thickness, pulse controls flicker rate.

### 6. Erosion

Displaced plane mesh connecting vertices (Delaunay triangulation of vertex positions). Heightfield driven by layered simplex noise. Particles crumbling off steep edges (gravity + collision). Sediment accumulation at low points (color darkening). Crack lines rendered as dark valleys in the displacement. Breathe controls erosion depth, pulse controls particle shed rate.

### 7. Flow

Thousands of GPU-instanced particles moving through a 3D velocity field. Field defined by edge directions — particles follow the graph topology. Trail persistence via a feedback buffer (previous frame blended at 95% opacity). Particles spawn at vertices, die when they leave the field. Color mapped by velocity magnitude. Breathe controls field turbulence, pulse controls particle speed.

Each mode targets 5,000-50,000 particles/vertices depending on complexity, with GPU instancing for everything above 1,000 instances.

## Post-Processing Pipeline

7 independently toggleable effects. All default OFF — the user opts into the cinematic look.

| Effect | Description | Default |
|--------|-------------|---------|
| Bloom | Multi-pass Kawase blur, selective per-object via emissive mask | OFF |
| Chromatic Aberration | RGB fringing at edges, cinematic lens feel | OFF |
| Vignette | Darkened corners, focuses attention on the mesh | OFF |
| Depth of Field | Bokeh blur on distant/near elements | OFF |
| Film Grain | Temporal blue noise grain, no repeating pattern | OFF |
| Tone Mapping | ACES filmic — compresses HDR into natural range | OFF |
| Motion Blur | Per-object velocity-based blur | OFF |

Toggle UI: 7 small buttons in the controls bar (BLM, CHR, VIG, DOF, GRN, TMP, MBL). OFF = muted text, ON = white text + subtle glow indicator.

## Camera & Interaction

### Default — Parallax

- PerspectiveCamera, FOV 60, position (0, 0, 500)
- GridPoints mapped to 3D: screen space to world space centered at origin (-250 to 250 X, -150 to 150 Y, 0 Z)
- Camera position offset by cursor position (max ~15 units displacement)
- Spring physics easing: damping 0.92, stiffness 0.08
- Scroll-to-zoom in both modes

### Alt/Option Hold — Full Orbit

- Full OrbitControls via Drei — rotate, zoom, pan
- Smooth transition in/out (camera lerps to orbit state, back to parallax on release)
- Double-click resets camera to default position

### DotGrid Overlay

- SVG overlay at z-index 10, unchanged
- Click interactions unchanged — first click selects, second click creates edge

## Mixed Media — Image Planes

### Auto-Generated (Magic by Default)

- Appear after the first edge is created (no planes on empty canvas)
- System scatters 2-4 floating rectangles near the mesh
- Content: GPU-generated textures — simplex noise gradients, glitch patterns, Voronoi cells, color field washes
- Positioned slightly off the mesh Z-plane (+-30-80 units depth) for parallax
- Subtle animation: slow drift + gentle rotation
- Semi-transparent, blend with the scene (multiply/screen blend modes)
- Refresh on `randomizeSeed()` (Shuffle button)
- Count and density scale with edge count
- Removed when all edges are cleared (Clear button)

### User Drag-Drop

- Drop image file onto canvas — creates floating textured plane
- Placed near mesh centroid at random depth offset
- Repositionable by dragging (raycasted hit test)
- Thin white border with subtle drop shadow
- Small numbered label in corner (data-art aesthetic)
- Max ~10 user images

### Both Types

- `THREE.PlaneGeometry` with `MeshBasicMaterial` (unlit, texture-mapped)
- Affected by post-processing
- Auto-generated textures tint toward active palette colors

## Particle System

### Global Dust Field (ParticleField)

- Always-on ambient particles across entire viewport volume
- 500-1000 GPU-instanced points
- Tiny (1-3px), white, low opacity (0.05-0.15)
- Slow Brownian drift via curl noise velocity field
- Unaffected by render mode — environmental atmosphere

### Per-Mode Particles

Each render mode manages its own particle system within its shader:

- Fluid: caustic sparkles on blob surfaces
- Nebula: dense star points within cloud volume
- Crystal: prismatic light fragments scattering off facets
- Mycelium: spore emissions from tendril tips
- Plasma: charged particle trails along arcs
- Erosion: crumbling debris with gravity
- Flow: streaming velocity particles with trail persistence

### Performance Budget

- GPU instancing via `InstancedBufferGeometry` for everything above 100 particles
- Particle positions computed in vertex shader (not JS)
- LOD: count scales with device pixel ratio and GPU tier
- Budget: ~50,000 total particles across all systems at 60fps target

## Performance & Adaptive Quality

### GPU Tier Detection

On mount, `detect-gpu` classifies device into 3 tiers:

- **Tier 1** (integrated/mobile): reduced particle counts, simpler shaders, half-res post-processing
- **Tier 2** (mid-range discrete): full particle counts, full shaders, full-res post-processing
- **Tier 3** (high-end): everything maxed, higher particle budgets

### Adaptive Framerate

- Target 60fps, monitor via `performance.now()` delta averaging
- If avg frame time exceeds 20ms (below 50fps) for 30 frames, drop one quality tier automatically
- Restore after 60 stable frames at higher quality
- Quality knobs in sacrifice order: particle count, post-processing resolution, shader complexity

### Resource Management

- R3F handles disposal on unmount
- Shader programs compiled once per mode, cached
- Textures loaded via `useTexture` with automatic GPU upload/dispose
- BufferGeometry reused across mode switches — only material swaps
- Single render pass per frame (no multi-pass shadows)
- No shadow maps — all lighting is direct + emissive
- Frustum culling on image planes and distant particles

## Store Changes

Minimal additions to `creator-store.ts`:

### Updated Type

```typescript
type RenderMode = "fluid" | "nebula" | "crystal" | "mycelium" | "plasma" | "erosion" | "flow"
```

### New State

```typescript
postFX: {
  bloom: boolean        // default false
  chromatic: boolean    // default false
  vignette: boolean     // default false
  dof: boolean          // default false
  grain: boolean        // default false
  toneMapping: boolean  // default false
  motionBlur: boolean   // default false
}

imagePlanes: ImagePlane[]
// ImagePlane = { id: string, url: string, position: [number,number,number], rotation: [number,number,number], scale: number }
```

### New Actions

```typescript
togglePostFX(effect: keyof PostFX): void
addImagePlane(file: File): void
removeImagePlane(id: string): void
updateImagePlane(id: string, transform: Partial<Transform>): void
```

### Unchanged

- `points`, `edges`, `selectedPoint` — all grid data
- `breathe`, `pulseSpeed`, `tempo`, `seed` — animation parameters (fed as shader uniforms)
- `palette` — mapped to shader color LUT
- `extrudeDepth` — stays unused
- All grid interaction actions
- `setRenderMode` — same function, new mode strings

## Controls Bar Updates

Same layout structure, updated content:

- **Mode buttons**: 7 buttons — Fluid, Nebula, Crystal, Mycelium, Plasma, Erosion, Flow (same styling)
- **Sliders**: Breathe, Pulse, Energy — unchanged
- **Palette swatches**: unchanged
- **NEW — FX toggles**: after palette swatches, divider + 7 small toggle buttons (BLM, CHR, VIG, DOF, GRN, TMP, MBL). OFF = muted, ON = white + glow. ~28px each.
- **Action buttons**: Shuffle, Undo, Clear — unchanged
- No image plane UI — drag-drop and auto-generation handle it

## Constraints

- `npm run build` must pass (TypeScript strict)
- `npx vitest run` — all existing tests must stay green
- No changes to studio/sandbox/template code
- No new routes
- Keep `MeshRenderer.tsx` on disk, just don't import it
- DotGrid.tsx unchanged
