---
inclusion: always
---

# Technology stack — StyleMe (web)

## Stack

- **App directory:** `web/`
- **Framework:** Vite 6 + React 19 + TypeScript
- **Routing:** `react-router-dom`
- **Styling:** CSS variables from [design-system/ai-hairstylist/MASTER.md](../../design-system/ai-hairstylist/MASTER.md) mapped in [web/src/theme.css](../../web/src/theme.css); component styles in [web/src/components/ui/ui.css](../../web/src/components/ui/ui.css)
- **Backend (optional):** Supabase JS client in [web/src/lib/supabase.ts](../../web/src/lib/supabase.ts); env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ([web/.env.example](../../web/.env.example))
- **Face / ideas:** Mock logic in [web/src/lib/faceShapeMock.ts](../../web/src/lib/faceShapeMock.ts) and [web/src/lib/styleIdeas.ts](../../web/src/lib/styleIdeas.ts); replace with a real model when ready

## Constraints

- Do not commit secrets; use `web/.env` locally and `web/.env.example` in git with placeholders only
- Enable **anonymous auth** in Supabase if using guest save

## Tooling

- **Kiro steering:** `.kiro/steering/*.md`
- **UI reference:** `.cursor/skills/ui-ux-pro-max/` (design system generator)
