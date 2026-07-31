# Astro Starter Kit: Blog

```sh
pnpm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## Chat API

The chat UI sends the current in-memory conversation to `POST /api/chat`.
The endpoint talks to a provider through the `ChatProvider` interface in
`src/core/chat/types.ts`; provider-specific request formats stay inside
`src/core/chat/providers/`.

### Cloudflare Workers AI

The default deployment uses the `AI` binding declared in `wrangler.jsonc` and
the Cloudflare-hosted model:

```text
@cf/meta/llama-3.1-8b-instruct-fp8
```

Set up and deploy:

```sh
pnpm install
pnpm wrangler login
pnpm cf:types
pnpm dev
pnpm deploy
```

Workers AI requests made during local development still use the Cloudflare
account and count toward its Workers AI allowance.

### Other model providers

The OpenAI-compatible adapter remains available for Ollama, llama.cpp, vLLM,
LM Studio, and hosted APIs that implement `POST /v1/chat/completions`. Copy
`.env.example` to `.env` when using this mode outside Cloudflare. API keys and
other chat configuration are server-only and must never use Astro's `PUBLIC_`
prefix.

To add a provider with a different protocol, implement `ChatProvider` in
`src/core/chat/providers/`, add its configuration name in
`src/core/chat/config.ts`, and register it in `src/core/chat/provider.ts`.

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
