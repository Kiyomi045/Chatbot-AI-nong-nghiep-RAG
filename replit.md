# Trợ lý Nông nghiệp AI

Chatbot tiếng Việt giúp nông dân tra cứu kiến thức về cây trồng, đất, nước và sâu bệnh dựa trên tài liệu có trích dẫn nguồn.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API gateway and FastAPI service (port 8080)
- `pnpm --filter @workspace/nong-nghiep-ai run dev` — run the React app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- FastAPI dependencies are tracked in the root `pyproject.toml` and run from `.pythonlibs`.
- Optional secret: `GEMINI_API_KEY` — enables Gemini answer generation; never commit or print it.
- ChromaDB data is stored locally under `artifacts/api-server/data/chroma`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite
- API: FastAPI + ChromaDB PersistentClient, started by the existing Express API gateway
- Embeddings: local ChromaDB default embedding model (`all-MiniLM-L6-v2`)
- Answer generation: Gemini `gemini-2.5-flash` when `GEMINI_API_KEY` is configured
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nong-nghiep-ai/` — React chat and knowledge-library interface
- `artifacts/api-server/python/app/main.py` — FastAPI routes, RAG flow, and seed documents
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks and schemas

## Architecture decisions

- Gemini is optional for the first build. With no key, the app returns retrieved excerpts and explicitly labels them as retrieval-only, not AI-generated advice.
- ChromaDB uses local embeddings so retrieval works independently from Gemini. The sample corpus is illustrative and must not be presented as authoritative agricultural guidance.
- The Express service remains a gateway for the existing `/api` route; it starts the FastAPI process internally so the React artifact uses the shared API route.

## Product

- Ask Vietnamese agriculture questions with optional crop and location context.
- Review cited passages from the knowledge base.
- Add and remove text-based knowledge documents.

## User preferences

- Keep the product focused on a basic farmer-support chatbot using RAG, React, FastAPI, ChromaDB, and Gemini.
- Build the app first; connect Gemini after the initial app is ready.

## Gotchas

- Seed entries are demonstration content, not verified local extension guidance. Replace or supplement them with trusted local materials before relying on agricultural recommendations.
- Local ChromaDB persistence is suitable for the prototype; confirm durable storage for a published production app.
- Add `GEMINI_API_KEY` through Replit Secrets only. Do not expose it to the browser.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
