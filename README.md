# Presence

Presence is a web app for face-to-face AI companion calls. You pick a companion
(the main one is **Moneymaka**), start a call, and talk or type. She answers
through an AI model, and her portrait is animated on a canvas: breathing, sway,
blinks, and mouth/jaw movement while she speaks. It installs to a phone home
screen as a PWA.

**Live:** https://presence-moneymaka.netlify.app

## Stack

- React 19 + TanStack Start (router + `createServerFn` server functions)
- Vite 8, Tailwind CSS 4
- Nitro 3 for the server build (Netlify preset on Netlify, Vercel preset by default)
- Canvas face animation in `src/components/companion-face.tsx`
- AI chat in `src/lib/ai.ts` (xAI first, then GitHub Models); without a key the call runs in demo mode with canned replies
- Voice: xAI TTS when `XAI_API_KEY` is set, otherwise the browser's built-in speech

## Run locally

```sh
npm install
npm run dev        # http://localhost:8080
```

`npm run build` produces a production build, and `npm run typecheck` runs TypeScript.

## Environment variables

| Name | Required | Purpose |
|------|----------|---------|
| `GITHUB_MODELS_TOKEN` | for real answers (free path) | Fine-grained GitHub token with **Models: read**, used against GitHub Models |
| `GITHUB_MODELS_MODEL` | optional | Model id, default `openai/gpt-4.1-mini` |
| `XAI_API_KEY` | optional | If set, chat uses xAI (`grok-4.5`) and real TTS voice |
| `VITE_AUTH_ENABLED` | set to `false` | Turns off the built-in sign-in gate |

Keep keys server-side only. Never give them a `VITE_` prefix, because those values are bundled into the browser.

## Deploying to Netlify

`netlify.toml` is included (`npm run build`, publish `dist`, `NITRO_PRESET=netlify`).
Nitro's Netlify preset emits the SSR/server-function handler as one Netlify Function.

1. Create a site and connect this repo, or deploy with the Netlify CLI.
2. Under Project configuration → Environment variables, add `VITE_AUTH_ENABLED=false`.
   Add `GITHUB_MODELS_TOKEN` as a secret with Builds, Functions and Runtime scopes.
3. Trigger a deploy, because env var changes only take effect after a new deploy.

## Note on images

The binary images were not committed by the upload tool used to create this repo:
`public/companions/moneymaka.png` (the companion portrait) and the PWA icons/install
images under `public/__grok/`. To build from a fresh clone, download the portrait from
https://presence-moneymaka.netlify.app/companions/moneymaka.png into `public/companions/`.
