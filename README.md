# Rose Atelier

A responsive Svelte 5 / SvelteKit nail preview PWA using fal.ai FLUX.2 Flash Edit.

## Run

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and set a private `FAL_API_KEY` (or `FAL_KEY`). Never prefix the key with `PUBLIC_` or commit `.env`. Rotate any key pasted into a chat.

## Checks and build

```sh
npm run check
npm run build
```

The Cloudflare adapter output is packaged into `dist/server/index.js` and `dist/client` for Sites hosting. Configure `FAL_API_KEY` as a secret in the hosting environment.

## Workflow

Upload JPEG, PNG, or WebP, or use the sample photo. Photos are normalized to approximately one megapixel in-browser. Pick a preset, write a design, choose an optional color and finish, and generate one preview. The server submits a fal queue job and signs an HTTP-only job cookie; the browser polls for completion. Downloads and a before/after slider are available when the result loads.

Uploads are not persisted by this app. The original photo remains in page memory, and is sent to fal only when generating. Provider retention policies apply. The cookie can recover queued results for 30 minutes, but the original comparison photo is lost on a full reload. No account, payment, gallery, or automatic nail segmentation is implemented.

Image editing is guided by a preservation prompt. The model can still alter skin, nail shape, jewelry, or the background. It does not support a nail mask in this endpoint. Add verified segmentation and compositing if strict pixel preservation is required. A generated preview is not a guarantee of salon results.

PWA manifest, PNG icons, service worker asset caching, offline fallback and platform installation instructions are included. AI generation requires connectivity. Home-screen installation and camera behavior still need verification on actual iOS and Android devices before production release.

The Site is private by default. Before opening generation to the public, add user authentication, durable quotas/rate limits, and billing controls. The signed job cookie protects result ownership but is not a spending quota.

Sample image: Chelson Tamares, [Unsplash](https://unsplash.com/photos/vtQHwU4F13s), Unsplash License.
