# StyleMe

The **StyleMe** web app lives in **`web/`** (Vite + React + TypeScript). Design tokens are aligned with **`design-system/ai-hairstylist/MASTER.md`** (generated via ui-ux-pro-max; folder name is from the design-system tool).

## User flow

1. **Splash** — intro; auto-advances to auth unless reduced motion (then use Continue).
2. **Auth** — **Continue as guest** (optional Supabase anonymous session when env is set).
3. **Setup** — gender preference, occasion, length preference, hair goal.
4. **Capture** — upload image or **take photo** (camera when the browser allows).
5. **Face shape** — local suggestion + manual confirmation (no Gemini/API required). Not medical advice.
6. **Prompt** — free text + **style pills** + **image preview**.
7. **Results** — **orbit gallery** of your upload (layout angles from a Slidez/Figma export) plus text idea cards; optional **AI preview images** on each card when `VITE_HAIR_PREVIEW_API_URL` points to your backend; **Copy summary**; **Save** (Supabase Storage + `style_sessions` when configured); **Start over** clears state and returns to splash.

## Wizard chrome and navigation

- **Progress** — a labeled stepper (Setup → Photo → Shape → Style → Results) appears on guest flow screens.
- **Back** — the top bar goes to the previous step in order, or to **Auth** from Setup. It does not rely on raw browser history so you stay inside the intended flow.
- **StyleMe** in the bar links to the splash screen.

## Draft persistence (localStorage)

- While **Continue as guest** is active, wizard fields (setup, prompt, pills, face shape, result ideas, last step) are **saved automatically** (debounced) under the key `styleme-wizard-v1`.
- **Photos are not persisted** — blob URLs are invalid after refresh. After reload, a **banner** can remind you to add a photo again before continuing past capture.
- **Continue as guest (new session)** on Auth clears the draft. If a draft exists, Auth can offer **Resume previous session** to restore text state and jump near where you left off (you still re-add a photo if needed).
- **Start over** / full reset clears in-memory state and removes the saved draft.

## Run locally

```powershell
cd "c:\Users\ABINAYA\OneDrive\Desktop\AI-hairstylist\web"
npm install
npm run dev
```

Or from repo root: `npm install --prefix web` then `npm run dev`.

Open **http://localhost:5173** (or the URL Vite prints).

## Optional: Supabase (Save)

1. Copy `web/.env.example` to `web/.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. In the Supabase dashboard, enable **Anonymous sign-ins** (Authentication → Providers).
3. Run SQL in `web/supabase/migrations/001_styleme.sql` (SQL editor) to create `style_sessions`, the `styleme-photos` bucket, and RLS policies.

Without `.env`, the app runs in **local-only** mode; Save shows a message instead of uploading.

## Optional: hairstyle preview images (API)

The results page calls `VITE_HAIR_PREVIEW_API_URL` to attach **generated image URLs** to idea cards (same uploaded photo + face shape + prompts are sent as multipart `photo` + JSON `context`, including a `generationPrompt` string for img2img-style models).

1. Deploy the included function at `web/supabase/functions/hair-preview/index.ts`:
   - `supabase functions deploy hair-preview --project-ref <your-project-ref>`
2. Set function secrets (never in client code):
   - `supabase secrets set OPENAI_API_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<service_role_jwt> --project-ref <your-project-ref>`
3. Optional: set `HAIR_PREVIEW_BUCKET` secret (defaults to `styleme-photos`).
4. In `web/.env`, set `VITE_HAIR_PREVIEW_API_URL=https://<your-project-ref>.supabase.co/functions/v1/hair-preview`.
5. Return format must be **`{ "images": ["https://..."] }`** or **`{ "urls": [...] }`** (4-5 URLs, mapped in order to result cards). Restart `npm run dev`.

Without this variable, the orbit still shows your **original** photo in the ring; cards stay text-only until an API is wired.

## Face shape mode (no Gemini)

The default flow is fully local:

1. The app creates a quick suggested shape from the captured photo URL (deterministic demo guess).
2. The user confirms or changes it manually on the Face Shape step (`Oval`, `Round`, `Square`, `Heart`, `Oblong`).
3. The selected value is used by prompt/style suggestion and results pages.

No face-shape API key or cloud call is required for this mode.

If you later want cloud vision again, `web/src/lib/faceShapeVision.ts` is kept in the repo as an optional integration path.

## Design system

- **Master:** [design-system/ai-hairstylist/MASTER.md](design-system/ai-hairstylist/MASTER.md)
- **CSS variables:** [web/src/theme.css](web/src/theme.css)

Regenerate or refine with:

```powershell
cd "c:\Users\ABINAYA\OneDrive\Desktop\AI-hairstylist"
python .cursor/skills/ui-ux-pro-max/scripts/search.py "beauty hair styling AI consumer app elegant dark trustworthy" --design-system --persist -p "StyleMe" -f markdown
```

## Kiro steering

See **`.kiro/steering/`** (`product.md`, `tech.md`, `structure.md`) and root **`AGENTS.md`**.
