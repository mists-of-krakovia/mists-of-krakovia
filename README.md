# Mists of Krakóvia

RPG multiplayer de exploração baseado em navegação por nós, com ênfase narrativa.
A exploração e a informação são o centro da experiência; a Névoa é o antagonista.

## Estrutura do monorepo

```
mists-of-krakovia/
├── backend/     # API Express + Supabase (service key, só no servidor)
├── frontend/    # SPA React + Vite
├── supabase/    # schema versionado (migrations) + seed — ver supabase/README.md
└── docs/        # documentos de design (PDFs): pilares, roadmap, classes, gameplay, mundo
```

## Pré-requisitos

- Node.js (backend e frontend)
- Supabase CLI (banco de dados)
- Git

## Configuração inicial (novo clone)

```powershell
# Backend
cd backend
npm install
Copy-Item .env.example .env   # preencha SUPABASE_URL e SUPABASE_SERVICE_KEY

# Frontend
cd ..\frontend
npm install
Copy-Item .env.example .env   # preencha VITE_API_URL
```

Nunca commite os arquivos `.env` — apenas os `.env.example`.

## Rodando em desenvolvimento

```powershell
# Terminal 1 — backend (porta 3001)
cd backend ; node server.js

# Terminal 2 — frontend (Vite)
cd frontend ; npm run dev
```

## Banco de dados

O schema é versionado em `supabase/`. Veja **[supabase/README.md](supabase/README.md)**
para o fluxo de migrations e sincronização com o projeto remoto.

## Ambiente Windows com antivírus que inspeciona HTTPS (Avast/ESET/etc.)

Se o antivírus fizer inspeção TLS, o Node não confia na cadeia reassinada e as
chamadas ao Supabase falham com `fetch failed` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.

Solução (por máquina, não versionada):

1. Exporte o certificado raiz do antivírus (ex.: "Avast Web/Mail Shield Root")
   do repositório de certificados do Windows para `certs/<nome>.pem`.
2. Aponte o Node para ele, de forma persistente:
   ```powershell
   [Environment]::SetEnvironmentVariable("NODE_EXTRA_CA_CERTS", "<caminho-absoluto>\certs\avast-root.pem", "User")
   ```
   Abra um terminal novo depois de definir.
3. Adicione a pasta do projeto às **exceções** do antivírus, para ele não
   virtualizar/interromper o processo `node.exe`.

A pasta `certs/` é ignorada pelo Git (específica de cada máquina).

## Documentação de design

Os PDFs em `docs/` são a especificação do jogo (fonte de verdade de design):
Core Pillars, Roadmap, Classes (v2), Gameplay/Combate (v1), Interface (v2),
Mundo/Lore, e o Master Document (compilação dos volumes).
