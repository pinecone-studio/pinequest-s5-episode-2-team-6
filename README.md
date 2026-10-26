# Anatomn

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference, supplemented with Z-Anatomy nerves, lymph nodes, glands, middle ear, and joint structures, apart into **2,763 individually selectable meshes**, explore **16 anatomical systems**, and search **3,745 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Ask the AI assistant anything and get a detailed Mongolian answer; anatomy questions can also rotate or highlight the model.
- Peel the body back layer by layer, or cut it open with the cross-section tool.
- Follow a guided tour, take the quiz, and switch floating labels on.
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

## Validate

Open **Plaque lab** in the atlas for the renal-artery teaching demo: adjust diameter
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

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, tap-versus-drag handling, assistant answers and the model actions they return, structure facts and innervation notes, layer peeling, and the tour and quiz content. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, the assistant panel, layer peeling, cross-sections, floating labels, tours and the quiz, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**, plus 529 supplementary meshes from **Z-Anatomy**, licensed **CC BY-SA 4.0** (see `public/ATTRIBUTION.md`). It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh; the 220 BodyParts3D bones keep their full source resolution. The packaged model contains 3,043,414 triangles and downloads approximately 42 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

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

## The assistant, tours and quiz

"Ask AI" is an LLM chat backed by a small server-side endpoint, `api/chat.ts`, with the shared implementation in `server/chat.ts`. It accepts any free-form question — anatomy or a general topic — and streams a detailed, structured answer in Mongolian. Medical, scientific and Latin terminology stays in its original form. When a structure is selected and the question matches atlas content, those notes are sent as context so anatomy answers stay grounded in the same reference data the detail panel shows; other questions are answered from the model's general knowledge. The system prompt asks for in-depth answers of roughly 400–900 words with headings, examples and a short conclusion, and the panel works even before the 3D atlas finishes loading. The default Gemini model is `gemini-3.5-flash-lite`, which starts streaming in about a second; set `GEMINI_MODEL=gemini-3.6-flash` if you prefer deeper reasoning over speed.

The assistant still drives the 3D viewer: a deterministic planner reads the question, highlights named groups such as the rotator cuff, rotates the model, switches floating labels, and opens tours or the quiz. Those actions are shown as chips under the answer.

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

`LLM_RATE_LIMIT` controls the per-IP request limit (default 30 per minute). The `*_MODEL` variables are optional; the defaults are shown above. If a provider retires a model, point the variable at one your account can use. If no provider is configured, the panel explains what to set; the rest of the atlas, including tours and the quiz, keeps working. Chat messages are sent to the configured provider but are not stored by this app.

If OpenAI returns `insufficient_quota` / `credit_balance_exhausted`, add credits to that OpenAI project; the panel shows this as `provider_quota` instead of a generic rate-limit error.

## Rebuilding geometry

The optimizer preserves source triangles and normals for arterial, venous, cardiac,
and skeletal meshes. Run `node scripts/validate-source-preservation.mjs` to check
this policy. Existing packaged meshes are unchanged; recovering discarded detail
requires rebuilding from the original source meshes. Source fidelity does not
establish clinical accuracy, valid vessel lumens, or suitability for flow simulation.

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure. Afterwards run `node scripts/fix-systems.mjs` to correct display-system assignments and `node scripts/refine-bones.mjs OBJ_DIRECTORY && node scripts/compress-models.mjs` to restore full-resolution bones, then download the Z-Anatomy FBX files (`NervousSystem100`, `LymphoidOrgans100`, `VisceralSystem100`, `SkeletalSystem100`, `Joints100`) from https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX and run `node --max-old-space-size=8000 scripts/import-zanatomy.mjs FBX_DIRECTORY`.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, the `dist` output directory, and the `/api/chat` function. Add the LLM environment variable (`GEMINI_API_KEY`, or `LLM_PROVIDER` plus the matching key) in the Vercel project settings before deploying. The `vercel.json` rewrite excludes `/api`, so the chat function is not swallowed by the single-page-app fallback.

A static host can still serve the atlas, but the LLM chat needs a runtime that executes `api/chat.ts`. On other Node hosts, expose the shared `handleChatRequest` handler from `server/chat.ts` at `/api/chat`.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own licenses**: BodyParts3D geometry is CC BY 4.0, the Z-Anatomy supplement is CC BY-SA 4.0, and the Anatomy Standard illustrations and term lists shown in the detail panel are CC BY-NC 4.0 (non-commercial use only; refresh them with `node scripts/import-anatomy-standard.mjs`). Preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
