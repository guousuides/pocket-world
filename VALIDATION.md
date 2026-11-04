# Verification

- `node --check dist/app.js` / `node --check server.mjs` passed.
- `node verify.mjs` passed at 1440×900 and 390×844. This uses a simulated DOM/WebGL interface to verify generated geometry, projection bounds, three shelves, nine detail dialogs, theme switching and navigation. It does not compile shaders on a real GPU or confirm visual rendering.
- HTTP 200 and correct MIME types verified for HTML, CSS, JavaScript, JSON and GLB. Directory traversal is rejected with 403.
- Blender 5.2 successfully saved the `.blend` scene and exported the GLB. The GLB container and three named hotspots passed validation.
- Real browser visual QA is incomplete: browser access host unavailable; native Computer Use attempt timed out waiting for app approval.
- Online publishing is incomplete: Sites project identity was persisted in `.openai/hosting.json`, but the source workflow failed with `Unable to start Git.` No version or production deployment was created.

All artwork and placements are a stylized study, not an accurate survey. Sample portfolio content is marked in the experience.

## Room update

- Added a photo-inspired room as the default scene, with the campus retained at `?scene=campus`.
- The room contains 415 mesh parts and 34,616 triangles. The website and Blender use the same generated triangle geometry.
- `node verify.mjs` passes for both scenes at 1440×900 and 390×844, including all three shelves and nine detail dialogs per scene.
- HTTP 200 verified for both scene URLs, room JSON, room geometry, JavaScript, CSS and room GLB.
- `create-room.py` produced `my-room.blend`, `my-room.glb` and `room-preview.png`. Export success was verified from the log and output files. The Blender render was visually inspected; room arrangement and furniture are visible. The room GLB container and three hotspot nodes pass validation.
- The photo itself is not served or included in the project. Furniture dimensions and unseen surfaces are estimated. WebGL browser visual QA remains incomplete; the Blender render is a model preview, not a website screenshot.

## First-person update

- Added a perspective camera, first-person walking with substepped furniture/wall collisions, drag look, optional user-initiated pointer lock, and mobile movement controls.
- Added four physical pickup/read/return flows (portfolio book, notebook, phone and archive paper), PC reading, reachable interaction checks and furniture occlusion checks. Existing archive content in the workspace was preserved.
- The WebGL renderer adds procedural material variation, smooth normals, specular reflection, packed shadow maps and time-of-day lighting. Interior wall/ceiling closure is included only in first-person mode.
- `node verify-inside.mjs` passed at desktop and mobile sizes. It verifies physics, interaction state transitions, finite item/hand/perspective matrices, geometry uploads and rendering command paths using a simulated DOM and GPU. It does not verify a browser's GLSL compiler or real visual output.
- Existing scene tests passed for campus and room model views. HTTP 200 verified for the first-person page and all newly referenced modules, CSS and geometry.
- The browser automation route is unavailable for confirmed visual QA. The existing local server is used for the interactive result; no additional online deployment was attempted because Git is unavailable.
- The Blender first-person composition was rendered with Workbench to `models/inside-preview.png` and visually inspected. The editable `.blend` contains the closed room, first-person camera, interior lights and procedural material nodes. The high-cost Cycles preview was stopped; no Cycles image is claimed.
