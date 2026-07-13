# StyleMe Mobile App

Expo + React Native app with MediaPipe face shape detection (dev build required).

## Setup

```bash
cd styleme-app
npm install
npm run download:model
```

## Dev client (required for MediaPipe native module)

Expo Go does not include the `face-landmarks` module. Use a custom dev client:

```bash
npx eas build --profile development --platform android
npx expo start --dev-client
```

Scan the QR code with your dev client APK. Fast refresh works the same as Expo Go.

## MediaPipe model

Before building Android, download the face landmarker model:

```bash
npm run download:model
```

This saves `assets/face_landmarker.task` (~3.6MB), bundled into the native app at prebuild time.

## Project layout

- `lib/faceShape.ts` — classifyShape math ported from web
- `lib/styleData.ts` — hairstyle catalog + recommender + STYLE_PILLS
- `lib/setupOptions.ts` — setup pill values from web
- `lib/theme.ts` — design tokens from web CSS
- `modules/face-landmarks/` — native MediaPipe IMAGE-mode inference
