# Human Atlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference, supplemented with Z-Anatomy nerves, lymph nodes, glands, middle ear, and joint structures, apart into **2,763 individually selectable meshes**, explore **16 anatomical systems**, and search **3,745 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run check
npm run lint:mn
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
npm run build
```

`npm run lint:mn` checks the Mongolian content in `app/mn/` for repeated words, number ranges written with an ASCII hyphen, stray English words, unbalanced parentheses, and missing sentence endings.

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**, plus 529 supplementary meshes from **Z-Anatomy**, licensed **CC BY-SA 4.0** (see `public/ATTRIBUTION.md`). It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh; the 220 BodyParts3D bones keep their full source resolution. The packaged model contains 3,043,414 triangles and downloads approximately 42 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## Монгол хэлээрх анагаадын тайлбар

The viewer's structure names stay in their Latin or foreign form, while every explanation is written in Mongolian.

| File | Contents |
| --- | --- |
| `app/mn/systems.ts` | The 16 anatomical systems: Mongolian names, Latin names, and detailed Mongolian overviews. |
| `app/mn/organs.ts` | Curated organ entries (heart, liver, brain, lungs, kidneys, glands, vessels, valves, …) with their Latin name and a detailed Mongolian overview. |
| `app/mn/bones.ts` | A detailed Mongolian overview for each of the 42 entries of `app/bone-atlas.ts`, keyed by atlas id. |
| `app/mn/structures.ts` | A detailed Mongolian overview for each of the 27 entries of `app/structure-atlas.ts` (suprahyoid muscles, intervertebral discs, knee and pelvic ligaments, teeth). |
| `app/mn/glossary.ts` | The English → Mongolian terminology lexicon used to name the remaining structures. |
| `app/mn/terms.ts` | Latin term → Mongolian glossary used by the terminology list in the detail panel. |
| `app/mn/index.ts` | The description engine: it names a structure in Mongolian, picks the curated entry when one exists, and otherwise composes a system- and region-aware explanation. |
| `app/mn/README.md` | The shared style guide: terminology, Mongolian grammar rules, and the source list every entry follows. |

`explanation()` in `app/anatomy.ts` now returns Mongolian text, so all 2,763 modeled pieces have an explanation: curated text for organs, bones, joints and teeth, and a generated description for every vessel, nerve, muscle and ligament.

The search panel matches Mongolian names too, so typing "зүрх", "дундаж яс" or "лимфний зангиа" finds the matching structures alongside the English source names.

Bone and joint figures come from [Anatomy Standard](https://www.anatomystandard.com/) (Jānis Šavlovskis & Kristaps Raits, CC BY-NC 4.0); the Latin terminology lists and the Mongolian explanations build on that reference.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure. Afterwards run `node scripts/fix-systems.mjs` to correct display-system assignments and `node scripts/refine-bones.mjs OBJ_DIRECTORY && node scripts/compress-models.mjs` to restore full-resolution bones, then download the Z-Anatomy FBX files (`NervousSystem100`, `LymphoidOrgans100`, `VisceralSystem100`, `SkeletalSystem100`, `Joints100`) from https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX and run `node --max-old-space-size=8000 scripts/import-zanatomy.mjs FBX_DIRECTORY`.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own licenses**: BodyParts3D geometry is CC BY 4.0, the Z-Anatomy supplement is CC BY-SA 4.0, and the Anatomy Standard illustrations and term lists shown in the detail panel are CC BY-NC 4.0 (non-commercial use only; refresh them with `node scripts/import-anatomy-standard.mjs`). Preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
