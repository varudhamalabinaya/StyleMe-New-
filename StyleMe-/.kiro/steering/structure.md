---
inclusion: always
---

# Project structure — StyleMe (web)

## Repository layout

```
├── design-system/ai-hairstylist/   # MASTER.md (ui-ux-pro-max persist output)
├── .kiro/steering/                 # Kiro product / tech / structure
├── web/
│   ├── src/
│   │   ├── components/ui/         # Screen, Button, Card, inputs, pills, FlowProgress
│   │   ├── context/               # wizard-context.ts, WizardProvider, useWizard
│   │   ├── lib/                   # supabase, faceShapeMock, styleIdeas
│   │   ├── pages/                 # Splash, Auth, Setup, Capture, FaceShape, Prompt, Result
│   │   ├── routes/                # paths, RequireGuest
│   │   ├── types/                 # wizard types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── theme.css
│   │   └── index.css
│   ├── supabase/migrations/       # 001_styleme.sql
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── package.json                    # npm run dev → web/
├── README.md
└── AGENTS.md
```

## Conventions

- **Wizard state:** Single `WizardProvider`; reset on **Start over** (revokes blob URLs).
- **Guards:** `RequireGuest` route layout — setup onward requires guest session flag.
- **Supabase:** All server I/O in `web/src/lib/supabase.ts` and call sites in `ResultScreen` (save).

## When the repo diverges

Update this file when adding features (e.g. real vision API, auth providers).
