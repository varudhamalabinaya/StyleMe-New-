# StyleMe Backend

Spring Boot 3 + Java 17 API for StyleMe mobile hairstyle preview generation.

## Features

- **Strict OpenAI edit prompts** — identity preservation, hair-only edits, photorealistic output
- **`sanitizeStyleRequest()`** — strips non-hair instructions (e.g. "make me taller", "change my shirt")
- **4 preview variations** per session — same base style, slight interpretation differences
- **REST API** — create session with photo, then generate previews

## Run locally (no Supabase)

```powershell
cd styleme-backend
$env:OPENAI_API_KEY = "<your-key>"
$env:STYLEME_PUBLIC_BASE_URL = "http://localhost:8080"   # use your LAN IP for a physical phone
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

Or double-click / run `start-local.cmd` after setting `OPENAI_API_KEY`.

> **Note:** If `mvn` is not recognized, use `.\mvnw.cmd` instead — no global Maven install needed.

Uses in-memory H2 and stores files under `uploads/`.

## Run with Supabase Postgres

```powershell
$env:OPENAI_API_KEY = "<your-key>"
$env:SUPABASE_JDBC_URL = "jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres"
$env:SUPABASE_DB_USER = "postgres"
$env:SUPABASE_DB_PASSWORD = "<db-password>"
$env:STYLEME_PUBLIC_BASE_URL = "http://<your-lan-ip>:8080"
mvn spring-boot:run
```

Use `.\mvnw.cmd` in place of `mvn` if Maven is not installed globally.

Set `STYLEME_PUBLIC_BASE_URL` to the host your phone/emulator uses to fetch generated image URLs.

## API

### `POST /api/sessions` (multipart)

| Field | Required | Description |
|-------|----------|-------------|
| `photo` | yes | User portrait (jpg/png) |
| `gender` | no | Setup gender |
| `occasion` | no | Setup occasion |
| `hairLength` | no | Hair length preference |
| `goal` | no | Hair goal |
| `faceShape` | no | Detected face shape |
| `userPrompt` | no | Free-text style note |
| `stylePill` | no | Selected quick-pick label |

**Response:** `{ "id": "<uuid>" }`

### `POST /api/sessions/{id}/generate`

Triggers 4 sequential OpenAI `gpt-image-1` image edits (~2–3 min each).

**Response:** `{ "images": ["http://.../uploads/..."], "count": 4 }`

## Prompt rules

Every OpenAI edit prompt follows this template:

> Edit the uploaded photo by changing ONLY the hairstyle. Preserve the person's identity exactly. Keep the face, skin tone, beard, mustache, expression, clothing, lighting, pose, camera angle, background and framing identical to the original image. Only replace the hairstyle with a realistic [sanitized request]. Do not beautify, retouch, enhance, regenerate or alter the face. The final result should look like the same person after getting a haircut at a professional salon.

If the user prompt is empty or unrelated, a fallback style is chosen from `faceShape` + `gender`.

## Tests

```powershell
mvn test
```

Use `.\mvnw.cmd test` if `mvn` is not on your PATH.

## Smoke test (live OpenAI)

```powershell
# Terminal 1 — start server (see above)
# Terminal 2
$env:OPENAI_API_KEY = "<your-key>"
.\scripts\test-generate.ps1 -Case mixed
.\scripts\test-generate.ps1 -Case unrelated
.\scripts\test-generate.ps1 -Case pill-only
```

## Security

- Store `OPENAI_API_KEY` only in environment variables — never commit it.
- Rotate any key that was shared in chat or logs.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | — | OpenAI API access |
| `STYLEME_PUBLIC_BASE_URL` | `http://localhost:8080` | Base URL returned in image links |
| `SUPABASE_JDBC_URL` | local postgres | Database connection |
| `SUPABASE_DB_USER` | `postgres` | Database user |
| `SUPABASE_DB_PASSWORD` | `postgres` | Database password |
