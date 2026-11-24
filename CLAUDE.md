# kureev.com — working rules

Alexey's personal site and the public course *Electronics for a robot arm* at `/electronics`.
Static files, no build step, deployed by Vercel from `main`. Everything served is a file in this repo; edit these files directly.

Talk to Alexey in casual Russian (на «ты»), short and blunt. Report what changed and what you **actually verified**, with screenshots. Never report a visual change you have not looked at.

## Map

| Path | What it is |
|---|---|
| `index.html` | Home page. Hero = 3D bench with the SO-101 arm (`scene.js`). Header, name glitch, build-in on scroll. |
| `scene.js` | Hero scene (three.js r128 UMD from cdnjs). Desktop only. |
| `so101/` | SO-101 arm asset (`so101.js` loader, `so101.json` + `so101.bin`). TheRobotStudio, Apache-2.0, keep `LICENSE`. |
| `electronics/index.html` | Course hub: 3D studio + level cards column. |
| `electronics/studio.js` | The room: walls, shelving, books, plants, desk lamp, glare, sofa, floor lamp, prints, chair, rug, lights. `STUDIO.build(scene,{tex,quality,aim})`. |
| `electronics/lessonN.html` | One level each. Lesson content and the pedagogy data (`PED.init(key,{win,brief,pr,recall,end})`) are inline in the file. |
| `electronics/ped.js` | Pedagogy layer + lesson panel layout + level-complete dialog/confetti. Shared by all lessons. |
| `electronics/theme.css` | Course theme tokens, type scale, a11y, info popover. Shared. |
| `electronics/levels/lv0–9.webp` | Level card art (640×640). |
| `electronics/tex/`, `electronics/models/` | Textures (webp) and glTF models (`sofa.glb`). |

Runway source images and prompts live on Alexey's Mac in `~/Projects/kureev-assets/runway/` (`prompts.tsv`, `ids.tsv`). The Runway key is `RUNWAY_API_KEY` in `.env.local` (gitignored). Use it only from a shell on his machine; never print it, never ask for it in chat.

Commits: author `Alexey Kureev <Kureev@users.noreply.github.com>`. Push to `main`, then `git pull --ff-only` in `~/Projects/kureev.com` on the Mac.

## Verify before you report

- Render every visual change in headless Chrome (three.js works with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`). Serve the repo with `python3 -m http.server`; kill stale servers first, an old one keeps serving deleted files.
- Look at the screenshots yourself, including crops at 2× and at least three angles for 3D (default view, orbit left, orbit right, close-up of what changed). Check mobile at 390 px.
- If a change "has no effect", prove the right code is running (swap in a pure red material) before tuning numbers.
- No page errors in the console. axe: 0 violations on changed pages.
- When Alexey asks for a designer: spawn a reviewer agent with the screenshots, iterate until it returns APPROVED. Push back on its notes that contradict Alexey's explicit decisions, for example the name glitch.

## Brand and UI

- Navy brand. Ink `#eef1ff`, soft `#c9d2f5`, mute `#8f9bc4` (6.7:1 on navy), accent gradient `#5b9cff → #8a6bff`, copper `#ffb26b`. Green only for small success states, never as a brand accent or a headline eyebrow.
- Two fonts only: Unbounded for titles, Manrope for everything else. Scale: 13 meta, 15 UI, 16 body, 24 title. Nothing under 13 px.
- WCAG AA at minimum. Touch targets ≥ 44 px, visible focus, skip link, `prefers-reduced-motion` and `prefers-contrast` respected.
- Soft, laconic, "modest yet powerful". One bold thing per view. Avoid template tells: no rows of outlined pills (status = dot + word), no ALL-CAPS labels, no decorative boxes.
- **No panel backgrounds.** On desktop the 3D stage runs full width and the content floats over it as standalone translucent blocks (`rgba(10,15,40,.84)` + blur, 16 px radius), segmented by intention. For lessons the blocks are orient, think, try, do and more. Gaps between blocks pass pointer events to the scene. Shift the camera with `setViewOffset` by half the column width, and keep labels, HUD and popovers out from under the column.
- Lesson order inside a step: explanation → formulas/status → the task. The question always comes after the formulas.
- Every answer can be changed: "Try again" on wrong answers (it does not reveal the right one), "Start over" when a quiz is done, "Change" on a prediction.
- Popovers: the title and the close button sit on one row, and everything shares one left edge. Close buttons are 44 px with an 18 px SVG icon, never a tiny `×` glyph.
- Finishing a level means confetti (top layer, above the modal) and a centred dialog: level art, what you can do now, the check score, Back to the map, what's next. Never show a banner. On the last step `Next` becomes `Finish`.
- Progress bars are thin segmented lines, never tall blocks.
- Level cards share one art style. Generate new art with Runway `gen4_image` using an existing card as `@style` reference, the same navy background and no text. Pick the variant that is technically correct.

## 3D scene rules (learned the hard way)

**Light**
- Light comes only from visible sources: shelf LED strips (spots shining down onto the shelf below), the desk lamp, floor lamp, picture light, corner LED bar, laptop screen, printer chamber, PSU digits. Everything else is reflection: hemisphere ≤ 0.15.
- No fake directional "rim" lights and no wall washes. A light-like patch on a wall with no fixture is a bug.
- The floor must not be evenly lit. Lights near furniture cast shadows (the floor lamp casts point shadows so the sofa grounds).
- Glare: when looking into the lamp you get a warm (~`#fff1dc`), round, gaussian bloom above the bulb, faint spikes and no hard core. The shade has a warm enamel interior. Never let a metallic inner face reflect cool LEDs.

**Materials**
- three r128 with sRGB output brightens dark colours, so use near-black base colours.
- Dark props (laptop, PSU, boxes) use Lambert, because Standard gives pale grazing specular.
- Wood and shelves are matte with texture (bump/roughness); never perfectly smooth or shiny.
- Fabric has no plastic sheen. Velvet = the sofa's navy material with a fresnel sheen patched in `onBeforeCompile`.
- Book spines must be readable. Leaves must not look like saturated yellow-green cards.

**Scale and placement** (1 m = 11 units, the arm holder scale is 11)
- Desk is 2.3 × 0.85 m and never square. Laptop is ~30 cm with a keyboard deck, trackpad and bezel. The enclosed printer is ~43 cm.
- Check relative sizes against the arm on every change.
- Nothing floats or intersects. Lamps stand on something and have a cord to the floor or desk. A trailing plant shows its pot. Furniture doesn't pass through lamps.
- Keep occluders, like the chair, out of the default sightline to the desk.

**Wiring**
- Every cable connects things that would really be connected (PSU → power input, servo bus → arm driver).
- Cables are matte silicone, rest on the desk with slack, and are not straight rods.

**Labels**
- Labels never overlap and never hide under the column.
- In the default view all level labels 0–8 are visible; colliding ones step up with a leader line.

**Technical truth**
- Components on art and models must be right for the ratings. A 12 V/10 A input uses a screw terminal (not a barrel jack), a blade fuse and a MOSFET or Schottky. Nothing has leads soldered into air.

**Assets**
- Use public models only with a licence that allows it (CC0 or CC-BY with a credit in the hub footer). Strip their lights.
- Compress textures (JPEG/webp ≤ 1024 px). The sofa `.glb` is ~570 KB; keep new models in that range.

## Home page hero

- The arm stays assembled at every scroll position. It follows the cursor smoothly with the target clamped into reach, and it does not grab or pick anything.
- Idle: it hovers over the breadboard. Easter eggs stay (R R → Fast Refresh, click the LED).
- The glitch is on the name only: RGB split ≤ 3 px, ~400 ms, every 7–12 s and on hover, not in the first 2 s, off under reduced motion.
- No 3D on mobile, or under save-data or no-hover; the page must stay light.
- Scale must look balanced next to the copy; the arm grounded on a visible mat with a contact shadow.

## Course content

- Teaching follows Merrill's first principles.
  - **Problem first:** a collapsed brief with goals.
  - **Activation:** a warm-up recall, one question at a time.
  - **Demonstration:** predict → observe → explain; the controls are locked until the learner predicts.
  - **Application:** faded practice.
  - **Integration:** a mixed end check plus an "I can" self-check.
- Keep the text plain and specific. Numbers and electrical claims must be correct; check them before writing.

## Languages

- English is the source text. Russian lives in `electronics/i18n/ru.js` (shared) and `ru.<page>.js` (`ru.hub.js`, `ru.lessonN.js`), keyed by the exact English string.
- `electronics/i18n.js` picks the language (`?lang=`, then the saved choice, then the browser), loads the dictionaries, formats numbers and units with `Intl` (`I18N.nf`, `I18N.u`) and adds the EN/RU switch.
- In page code wrap every user-facing string in `_t()`; templates use placeholders: `_t('Lowest {0}', fV(v))`. Static markup is translated by `I18N.apply`; pedagogy data by `I18N.deep` inside `PED.init`.
- Change an English string and its Russian key must change with it, or that string falls back to English. Before shipping, open each page with `?lang=ru`, click through all steps and check `I18N.miss` is empty. Bump `v=` in `i18n.js` when dictionaries change.

## Checklist before saying "done"

1. Rendered and looked at it (desktop + mobile, several angles for 3D).
2. No overlaps, nothing floating, nothing shiny that shouldn't be, every light has a source.
3. Contrast AA, targets ≥ 44 px, no console errors.
4. Committed and pushed, and pulled on the Mac.
5. Reply in Russian: what changed, what was verified, screenshots.
