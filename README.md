# Anatomn

Fracture Lab (`/fracture`) now opens a full-skeleton fracture explorer covering all **212 skeletal mesh parts (209 distinct names)**. Prompts match atlas bone names, common aliases, sides, numbered ribs, vertebral shorthand such as `C3` and `T7`, and regions such as `skull`, `spine`, `wrist`, `hand`, and `foot`. Try “oblique right femur fracture”, “left radius and left ulna”, or “show every bone fracture”. Multiple matches appear in a bone selector and are animated one at a time; an exact-name searchable catalogue also exposes every mesh, including duplicate-name parts by ID.

The explorer uses the actual bone geometry with crosswise, oblique, or two-cut/three-fragment examples, three selectable cut locations, aligned fragments, reversible timeline controls, and stage explanations. Playback starts after the mesh loads. These are geometry demonstrations on long, short, flat, and irregular bones, not bone-specific clinical injury models or predictions of which bones an impact would break. Spiral, compression, greenstick, stress, comminuted, open, and joint/head/neck injury models are explicitly unsupported. The existing backward-fall lesson and detailed clavicle controls remain available. Run `node --experimental-strip-types scripts/validate-bone-fractures.mjs` to verify prompt coverage and nonempty fracture contours for every skeletal mesh across all three patterns and locations.

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference, supplemented with Z-Anatomy nerves, lymph nodes, glands, middle ear, and joint structures, apart into **2,763 individually selectable meshes**, explore **16 anatomical systems**, and search **3,745 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Ask the AI assistant anything and get a detailed Mongolian answer; anatomy questions can also rotate or highlight the model.
- Study with the AI teacher (`/teacher`): lessons anchored to Gray's Anatomy for Students chapters, a learning profile that remembers what you asked, and per-chapter progress.
- Peel the body back layer by layer, or cut it open with the cross-section tool.
- Take the quiz on its own page (`/quiz`), and switch floating labels on.
- Sit a timed exam on `/exam`; the bank has six 25-question papers — bones, muscles, arteries, veins, nerves and internal organs — and every question links back to its structure in the 3D atlas.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. The 3D atlas needs no account. The Ask AI panel needs an LLM key: copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` (or one of the other providers described below) before starting the dev server.

```sh
npm ci
cp .env.example .env.local
# edit .env.local and add your key
npm run dev
```

Open http://localhost:3016. The Vite dev server serves `/api/chat` from `server/chat.ts`, so the assistant works locally without a separate backend. To build the static site, run `npm run build`; the output is in `dist/`.

Vite reads `.env.local` once when the dev server starts, so restart it after editing. The file has to be named exactly `.env.local` at the repository root — a copy saved under a name with an invisible character, or one placed in `web/`, is ignored without a warning and the assistant reports that no key is set.

## Validate

### Clavicle fracture lab

**Guided education:** Pause and predict is on by default. Playback pauses at 32% (before slipping), 68.5% (before right-hand contact), and 78.5% (after contact, before the authored fracture). Students choose an answer, read feedback and the correct answer, then explicitly continue. Forward chapter/timeline seeks stop at the next unanswered prediction; resetting or replaying restarts the questions. Turn the option off for free exploration. Answers are kept only in component memory, not sent to a server.

The optional anatomy overlay labels the actual moving right clavicle, scapula, humerus, radius, ulna, and hand with screen-space leader lines. Clicking a label or anatomy chip pauses playback, highlights the source structure, and opens its Latin name and role below the viewer. Every stage has bilingual **Observe**, **Anatomy connection**, and **Remember** explanations, including the distinction between an illustrative loading route and measured force. Lesson content and structure mappings live in `app/fracture/education.ts`; run `node scripts/validate-fracture-education.mjs` for prediction ordering/seek gates, bilingual content coverage, and source-bone mapping checks. The lesson links to AAOS and makes no claim of instructor or clinical validation.

The **Fall scenario** view animates the actual atlas skeleton walking on tiled pavement, slipping forward at the right foot, falling backward, reaching behind with the right arm, and planting the right hand behind the body before an authored right midshaft clavicle fracture. The whole-body skeleton and right-clavicle close-up share one reversible timeline. Play/pause, replay, 0.25×/0.5×/1× speeds, stage buttons, timeline seeking, and camera reset are available on desktop and mobile. **Clavicle detail** retains the independent left/right fracture controls.

The slip choreography plants the right heel on the patch at 34%, slides it forward 24 cm by 47% while keeping the other foot planted, and delays the torso response until after traction is lost. A cyan arrow traces the slide. Knee yielding, a balancing arm reaction, a lifted recovery step, and gradual palm rotation lead into the existing hand-contact event. These are authored poses, not computed friction/contact dynamics. The fall validator also checks rigid leg lengths, grounded sliding-foot height, planted support-foot position, and continuity of palm orientation at hand contact.

`app/fracture/fall-model.ts` defines deterministic poses, approximate skeletal segment assignments, and two-link arm/leg inverse kinematics. The right wrist stays at the contact target from 72% of the timeline onward; the prescribed fracture displacement starts at 80%. A gold dashed line illustrates the arm-to-shoulder loading route without assigning force values. The fall is authored animation, not a dynamics solver: it does not calculate friction, impact forces, fracture thresholds, or injury probability, and an outstretched-hand fall does not invariably fracture the clavicle. Run `node scripts/validate-fall.mjs` to check event ordering, hand planting, rigid arm lengths, knee floor clearance, and finite/reversible poses across 1,001 timeline samples.

Open **Fracture Lab** from the bone icon in the navigation (`/fracture`). It loads the actual left or right clavicle from the atlas and uses two complementary clipping planes at the shaft midpoint to illustrate a simple midshaft fracture. Compare intact, nondisplaced, and displaced presets; adjust prescribed vertical displacement, medial translation of the lateral fragment, relative angulation, and animation progress. Play/pause, reset, and camera reset work without an account. English and Mongolian instructions explain the controls and link to [AAOS](https://orthoinfo.aaos.org/en/diseases--conditions/clavicle-fracture-broken-collarbone/).

This is a geometry teaching demonstration, not impact physics or an injury prediction. Fragment transforms are prescribed, not computed from tissue properties or loading; cut faces remain open mesh sections. It does not model fracture propagation, comminution, soft tissue, healing, or treatment decisions. Orange contours trace source-triangle intersections with the teaching fracture plane. Run `node scripts/validate-fracture.mjs` to check source mapping, midshaft coverage, mirrored transforms, units, neutral states, and invalid inputs.

Open **Plaque lab** from the navigation bar (`/plaque`) for the renal-artery teaching demo: adjust diameter
narrowing and segment length, compare relative flow, and inspect the selected renal
artery and its branches in 3D. Run `node scripts/validate-plaque.mjs` for model checks.
The dimensionless circuit is illustrative and does not predict clinical outcomes.

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
node scripts/validate-assistant.mjs
node scripts/validate-llm.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, tap-versus-drag handling, assistant answers and the model actions they return, structure facts and innervation notes, layer peeling, and the quiz content. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, the assistant panel, layer peeling, cross-sections, floating labels, the quiz, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

### Adult skeletal count

The conventional adult skeleton has **206 bones: 80 axial and 126 appendicular** ([OpenStax](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system)). `app/skeleton.ts` maps the atlas to this convention rather than counting meshes. The current model represents **205 of 206**: no separately identified coccyx mesh is available. The interface reports this coverage explicitly; it does not fabricate missing geometry. The sternum's three components count as one bone, the duplicate hyoid meshes count as one bone, the six auditory ossicles belong to the skeleton, and the 14 costal cartilages belong to connective tissue. Four additional foot sesamoid meshes remain available but are excluded from the conventional count (the two patellae remain included). Run `node scripts/validate-skeleton.mjs` to check the mapping and regional totals. This correction is not a medical validation of the remaining atlas.

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**, plus 529 supplementary meshes from **Z-Anatomy**, licensed **CC BY-SA 4.0** (see `public/ATTRIBUTION.md`). It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh; the 220 originally skeletal-classified BodyParts3D meshes keep their full source resolution; this is a mesh count, not an anatomical bone count. The packaged model contains 3,043,414 triangles and downloads approximately 42 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them. The Ask AI panel talks to the server-side LLM bridge in `server/chat.ts`; provider keys stay on the server.

## Usage counter

The landing page keeps a small usage tally: visits, visitors that went past the first screen or pressed a call to action, and atlas opens. The numbers live in `localStorage` under `human-atlas-usage`, so nothing leaves the device and no cookies are set, and they are shown in the statistics panel of the landing page.

Set `VITE_USAGE_ENDPOINT` to collect the same numbers on a server. The page then sends one `POST` per change (`visit`, `engage`, `open`, `depth`, `seconds`) and reads the running totals back with a `GET`:

```json
{"visits":128,"engaged":64,"opens":41,"seconds":3600,"depth":100,"last":1760000000000}
```

When the endpoint answers with totals, the landing page shows those numbers instead of the per device ones.

## Screen sizes

The landing page and the atlas are built for phones, tablets and desktops. The landing page stacks the copy under the body on a phone and on a portrait tablet, keeps the two column hero on a landscape tablet and on a desktop, and scales the big words so they never run off the screen. The atlas switches to the bottom dock and the sheet panels below 768 pixels and keeps the side panels above it. Checked at 320×568, 390×844, 768×1024, 820×1180, 1024×768, 1440×900 and 1920×1200.

## Ask AI

"Ask AI" is an LLM chat backed by a small server-side endpoint, `api/chat.ts`, with the shared implementation in `server/chat.ts`. It accepts any free-form question — anatomy or a general topic — and streams a detailed, structured answer in Mongolian. Medical, scientific and Latin terminology stays in its original form. When a structure is selected and the question matches atlas content, those notes are sent as context so anatomy answers stay grounded in the same reference data the detail panel shows; other questions are answered from the model's general knowledge. The system prompt asks for in-depth answers of roughly 400–900 words with headings, examples and a short conclusion, and the panel works even before the 3D atlas finishes loading. The default Gemini model is `gemini-3.5-flash-lite`, which starts streaming in about a second; set `GEMINI_MODEL=gemini-3.6-flash` if you prefer deeper reasoning over speed.

## The AI teacher

**AI багш** (`/teacher`, the graduation-cap link in the navigation) is a dedicated teaching chat for students. It answers whatever they do not understand and anchors every answer to the chapter structure of *Gray's Anatomy for Students*: the eight regional-anatomy chapters (The Body, Back, Thorax, Abdomen, Pelvis and Perineum, Lower Limb, Upper Limb, Head and Neck) are mapped in `app/teacher/textbook.ts` with keywords, section topics and starter questions. Picking a chapter pins the answer to it; leaving **Бүгд (авто)** routes the question to a chapter from its wording. The teacher explains in its own words following the book's regional method (surface anatomy → bones → muscles → vessels → nerves → clinical notes), never reproduces the book's text, and ends each answer with self-check questions plus the chapter to read next.

The teacher also learns about the student: every answered question is tagged with its chapter and saved to localStorage, and for a signed-in student also to the `teacher_questions` table (`supabase/schema.sql`), so the history follows them across devices. The profile — questions per chapter and a level from 1 to 3 (5 questions → level 2, 12 → level 3) — is sent with every turn, so later answers reference earlier questions ("өмнө бид ... ярилцсан") and pick their depth from the level. The **Миний ахиц** card shows the per-chapter bars and the **Миний асуултууд** card keeps the recent questions; clicking one puts it back in the input.

The teacher shares the `/api/chat` endpoint, provider configuration, rate limit and health check with the atlas assistant: the same `GEMINI_API_KEY` (or other provider variables) powers both, and `mode: "teacher"` in the request body selects the teaching prompt in `server/teacher.ts`. No textbook text is bundled with the app — the chapter map carries only the book's public structure, so the student reads the actual content in their own copy.

The assistant still drives the 3D viewer: a deterministic planner reads the question, highlights named groups such as the rotator cuff, rotates the model, switches floating labels, and opens the quiz page. Those actions are shown as chips under the answer.

## The quiz

The quiz (`/quiz`) deals a fresh run from a bank of 79 questions in `app/quiz/questions.ts`. Each question has one of six topics (bones, muscles, nervous system, joints and ligaments, heart and vessels, organs), a level from 1 to 3, and a concept that opens in the 3D atlas. A visitor picks the topic, level and length, can turn on a 30-second timer per question, and gets shuffled options, a per-topic breakdown and a rerun of the questions they missed. With "AI-written" selected, `POST /api/exam` with `mode: "quiz"` asks the configured LLM for new questions on the same topic and level; rows that are not a clean four-option question are dropped, and the request shares the assistant's per-IP rate limit. Asking the assistant for a quiz on a topic ("Гарын ясаар сорил өг", "quiz me on nerves") opens the quiz with that topic picked.

### LLM providers

Set one provider in `.env.local` for development and in the Vercel project's Environment Variables for deployment. Keys are read only on the server and are never sent to the browser.

```sh
# Gemini (default when GEMINI_API_KEY is set)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini

# OpenRouter
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-3.6-flash

# Any OpenAI-compatible server, such as Ollama or vLLM
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.1
```

Never commit `.env.local`; it is gitignored. Each teammate should create their own Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and add it to their local `.env.local`. If the team shares one key, send it through a private password manager or direct message — never through GitHub. For the deployed site, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the Vercel project's Environment Variables.

`api/exam.ts` (implementation in `server/exam.ts`) reads the same provider variables: `mode: 'grade'` scores a hand-in's case answers against the stored rubric, `mode: 'draft'` writes candidate questions for the admin screen — optionally grounded on one atlas structure (`group`, `part`, `facts`), and it always re-shuffles the correct answer out of the first option. Both endpoints run in the dev server too — `vite.config.ts` serves `/api/chat` and `/api/exam` from the same middleware.

`LLM_RATE_LIMIT` controls the per-IP request limit (default 30 per minute). The `*_MODEL` variables are optional; the defaults are shown above. If a provider retires a model, point the variable at one your account can use. If no provider is configured, the panel explains what to set; the rest of the atlas, including tours and the quiz, keeps working. Chat messages are sent to the configured provider but are not stored by this app.

If OpenAI returns `insufficient_quota` / `credit_balance_exhausted`, add credits to that OpenAI project; the panel shows this as `provider_quota` instead of a generic rate-limit error.

## Rebuilding geometry

The optimizer preserves source triangles and normals for arterial, venous, cardiac,
and skeletal meshes. Run `node scripts/validate-source-preservation.mjs` to check
this policy. Existing packaged meshes are unchanged; recovering discarded detail
requires rebuilding from the original source meshes. Source fidelity does not
establish clinical accuracy, valid vessel lumens, or suitability for flow simulation.

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure. Afterwards run `node scripts/fix-systems.mjs` to correct display-system assignments and `node scripts/refine-bones.mjs OBJ_DIRECTORY && node scripts/compress-models.mjs` to restore full-resolution bones, then download the Z-Anatomy FBX files (`NervousSystem100`, `LymphoidOrgans100`, `VisceralSystem100`, `SkeletalSystem100`, `Joints100`) from https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX and run `node --max-old-space-size=8000 scripts/import-zanatomy.mjs FBX_DIRECTORY`.

## Backend (Supabase)

The app has a backend on [Supabase](https://supabase.com) (project: `wckcbyobgpjwiolsdjjd`). The client is set up in [`lib/supabase.ts`](lib/supabase.ts) and the auth hook in [`hooks/use-auth.ts`](hooks/use-auth.ts). It provides:

- **Auth** — the signup (`/signup`) and login (`/login`) pages call `supabase.auth.signUp` / `signInWithPassword`. Email confirmation and password reset come from Supabase Auth for free.
- **Profiles** — the name typed at signup is stored in `public.profiles` by a database trigger (`supabase/schema.sql`).
- **Usage stats** — `public.usage_events` with an aggregate `public.usage_totals` view can back the landing-page tally instead of localStorage.
- **Quiz results** — `public.quiz_results` stores per-user quiz history.

### Setup

The publishable key is meant for the browser; row level security protects the data. Vars are read with the `VITE_` prefix (Vite app; the `NEXT_PUBLIC_` names don't apply here):

```sh
VITE_SUPABASE_URL=https://wckcbyobgpjwiolsdjjd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

For local development they live in `.env.local` (gitignored — copy them from `.env.example`, which ships the team's public values). Production builds read them from the committed `.env.production`, so a Vercel deployment signs people up through Supabase with no dashboard setup; Environment Variables set in the Vercel project override that file. Without them a deployment would fall back to the file account store in `server/auth.ts`, which on Vercel lives in a per-instance `/tmp` folder and loses accounts and sessions on every cold start.

### Local sign-in checklist

`/login` and `/signup` degrade to demo mode when the two `VITE_SUPABASE_*` vars are missing: `supabaseConfigured` is false, no request leaves the browser, and the pages still render. To sign in for real:

- Add your dev origin under Supabase Dashboard → Authentication → URL Configuration → **Redirect URLs**. Vite falls back to 3017, 3018… whenever 3016 is busy, so list the ports you actually use.
- With Authentication → Providers → Email → **Confirm email** enabled, a new account cannot sign in until its emailed link is opened: `signUp` returns no session and `/signup` routes to `/login` with the check-your-email note. GoTrue rejects reserved domains such as `example.com`, so a throwaway test address needs a real-looking domain.
- Both pages trim and lower-case the address, ignore a second submit while a request is in flight, and translate the raw GoTrue message into plain Mongolian through `app/auth-error.ts` (`invalid login credentials`, `Email not confirmed`, `User already registered`, …). After a successful sign-in the redirect uses `replace: true`, so Back does not return to the form.
- Signing out from `/profile` waits for `supabase.auth.signOut()` to finish: the page shows "Гарч байна…" instead of bouncing to `/login`, and a failed sign-out says so rather than pretending you left.

### One-time database setup

Open Supabase Dashboard → your project → **SQL Editor** → **New query**, paste a file, press **Run**. Do the four steps in order; each one is safe to run twice.

1. [`supabase/schema.sql`](supabase/schema.sql) — creates `profiles`, `payments`, `subscriptions`, `usage_events`, `usage_totals`, `quiz_results`, `teacher_questions`, `xp_events`, `exams`, `exam_questions`, `exam_attempts`, enables row level security with the policies behind the admin panel, and adds the triggers that keep profiles in sync with `auth.users` and do all the scoring. The `exams` table carries `group_key`, `part_key`, `part_mn` and `source`; the file also `alter table … add column if not exists` them, so a database migrated before the grouping exists only needs this file re-run.
2. [`supabase/exam_bank.sql`](supabase/exam_bank.sql) — seeds 18 short papers (72 multiple-choice and 18 case questions) grouped by anatomy: **Яс**, **Булчин**, **Артерийн судас**, **Венийн судас**, **Мэдрэлийн систем**, **Зүрх**. Each block starts with `if not exists (select 1 from public.exams where title = …) then`, so re-running it never duplicates a paper.
3. [`supabase/exam_categories.sql`](supabase/exam_categories.sql) — turns the six groups into one **25-question, 40-minute exam** each (50 points, 80% pass). It reuses the 15 questions from each group's three short papers, adds 10 new multiple-choice questions, and archives the short papers so students see one full paper per category. Run it after `exam_bank.sql`; it is idempotent too, and its last statement lifts every paper still stored at the old 70% pass mark to 80%.
4. Promote yourself, then refresh `/admin` (step 4 needs the profile row from step 1):

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

Pages that need the newer tables show a "run schema.sql" notice instead of failing, so an unmigrated database still renders the app.

### Exam bank: groups, structures, AI drafts

`lib/anatomy-groups.ts` is the catalogue. The six exam groups are `skeletal`, `muscular`, `arterial`, `venous`, `nervous` and `organs` (the `organs` group covers the heart plus the abdominal and thoracic viscera); `cardiac` stays as a legacy key for papers written before the full exams existed. Each group lists the structures a paper can be written about. The keys are atlas concept names, so the link under a paper (`/exam`) and the `concept` column on its questions resolve to the same part in the 3D atlas, and Mongolian names come from `app/mongolian-names.ts` rather than a second translation table.

- **/exam** lists published papers in those groups, with the group's atlas colour and a per-group count. `exam_categories.sql` leaves one 25-question paper in each of the six groups; papers with an empty `group_key` (the older team-written sets) fall into a last "Бусад шалгалт" section.
- **/admin → Шалгалтын сан** has two drafting paths. "AI draft" writes one paper from a free-text topic for a single review. "Generate a whole group" picks a group and any of its structures and writes one draft paper per structure, sending the verified Latin name, function and nerve from `app/structure-facts.ts` with the request so the model writes about real anatomy. Correct answers are re-shuffled out of slot A, and every paper is stored with `status = 'draft'`, `source = 'ai'`, `group_key`, `part_key`, `part_mn` and `concept = part_key`. Nothing is readable by a student until an admin presses **Нийтлэх**.
- Drafting costs one provider call per structure and the calls run one after another — about five to ten seconds each with the default `gemini-3.5-flash-lite`, so a whole group takes a couple of minutes. Grading and scores never come from the browser: see the next section.

### Roles: user, premium, admin

- **User** — every signup. Free access to the whole atlas plus search, the quiz and the exams.
- **Premium** — existing subscription records remain available for account administration. ROM Lab and Plaque Lab are free for everyone, including visitors without an account, so a plan no longer unlocks them; the plan cards stay on `/profile` for the payment queue and the XP discount.
- **Admin** — the `profiles.is_admin` flag. Promote the first admin with SQL (new users can never self-promote; a trigger blocks it):

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

`/admin` shows the payment queue (confirm/reject pending transfers), the exam bank (publish, archive, draft one paper or a whole group with the assistant) and the user list. **Дэлгэрэнгүй** on a user row opens that student's panel: XP balance, days attended, papers sat with their scores, quiz practice, payments, and two admin actions — grant XP and add premium days without a payment record. Everything the panel reads goes through the admin policies in `supabase/schema.sql` (the `quiz_results` select policy includes `public.is_admin ()` for exactly this reason).

### XP, exams and what the browser cannot fake

- Attendance (`claim_daily_checkin()`, +10 once a day) and a first pass of an exam write rows into `xp_events`. The table has a select policy only, so a student can read their own points but never insert them.
- At checkout the client sends the XP it would like to spend. `guard_payment()` recomputes the price from `plan_price()`, caps the spend at the balance and at 20% of the plan, and freezes `amount_mnt`, `discount_mnt` and `xp_spent` for the life of the order. A rejected order returns the points.
- An attempt is scored by `score_exam_attempt()` on insert: multiple-choice points come from the stored answer keys, the case score is clamped to what the case questions are worth, and the pass flag and XP award are computed there. `/api/exam` (`mode: 'grade'`) only ever supplies the case score and the feedback text; `mode: 'draft'` writes candidate questions that stay in `draft` until an admin publishes them.

### Data flow of one payment

1. User presses **Төлөх** on `/profile` → a `payments` row with status `pending` is created, with the price and any XP discount set by the database.
2. User transfers the amount with QPay / SocialPay / bank app and saves the **transaction reference**.
3. Admin opens `/admin` → **Confirm** → the row becomes `completed`, `confirmed_by`/`confirmed_at` are set, and the `on_payment_confirmed` trigger adds 30/365 days to `subscriptions` (stacked after any remaining time).
4. `useSubscription()` picks up the change for account status. Lab access is independent of subscription status.

### Reading and writing data from a component

```ts
import {supabase} from '../lib/supabase';

// insert a quiz result for the signed-in user
const {data,error}=await supabase.from('quiz_results').insert({score:8,total:10});

// read counts
const {count}=await supabase.from('usage_events').select('*', {count:'exact',head:true});
```

Hooks: `hooks/use-auth.ts` (session, `signOut`) and `hooks/use-subscription.ts` (`isAdmin`, `premium`, `expiresAt`). If the env vars are missing (`supabaseConfigured === false`), the login and signup pages still render and continue in demo mode so the rest of the atlas keeps working.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, the `dist` output directory, and the `/api/chat` function. Add the LLM environment variable (`GEMINI_API_KEY`, or `LLM_PROVIDER` plus the matching key) in the Vercel project settings before deploying. The `vercel.json` rewrite excludes `/api`, so the chat function is not swallowed by the single-page-app fallback.

A static host can still serve the atlas, but the LLM chat needs a runtime that executes `api/chat.ts`. On other Node hosts, expose the shared `handleChatRequest` handler from `server/chat.ts` at `/api/chat`.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own licenses**: BodyParts3D geometry is CC BY 4.0, the Z-Anatomy supplement is CC BY-SA 4.0, and the Anatomy Standard illustrations and term lists shown in the detail panel are CC BY-NC 4.0 (non-commercial use only; refresh them with `node scripts/import-anatomy-standard.mjs`). Preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
