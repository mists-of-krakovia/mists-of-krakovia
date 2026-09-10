# Banco de dados — Mists of Krakóvia (Supabase)

O banco é parte central do projeto e é **versionado neste repositório** via Supabase CLI.
A fonte de verdade do schema são os arquivos em `supabase/migrations/`.

> Ambiente: **sem Docker** nesta máquina. Trabalhamos com migrations versionadas e
> aplicação direta no projeto remoto (`db push`). Quando Docker estiver disponível,
> dá para rodar um Postgres local (`supabase start`) e testar antes de subir.

## Estrutura

```
supabase/
├── config.toml        # configuração do projeto (project_id, portas locais)
├── migrations/        # histórico de schema — NUNCA editar migration já aplicada
├── seed.sql           # dados iniciais do mundo (Ironfall, NPCs, itens, ...)
└── README.md          # este arquivo
```

## Primeira sincronização (uma vez)

O schema já existe no projeto remoto do Supabase. Para trazê-lo para o repo:

```powershell
# 1. Autenticar (abre o navegador)
supabase login

# 2. Ligar este repo ao projeto remoto (project ref está na URL do Supabase)
supabase link --project-ref <PROJECT_REF>

# 3. Gerar a migration inicial a partir do schema remoto
supabase db pull
```

Isso cria `supabase/migrations/<timestamp>_remote_schema.sql` com o schema atual
(incluindo os ENUMs `USER-DEFINED`). Commite esse arquivo.

## Fluxo de trabalho contínuo (a cada mudança de schema)

Nunca altere o banco pelo dashboard sem versionar. O ciclo é:

```powershell
# 1. Crie uma nova migration vazia e escreva o SQL da mudança
supabase migration new <descricao_curta>
#    -> edite o arquivo criado em supabase/migrations/

# 2. Aplique no projeto remoto
supabase db push

# 3. Commite a migration
git add supabase/migrations
git commit -m "db: <descricao_curta>"
```

Regra de ouro: **uma mudança de schema = uma nova migration**. Não se edita
migration já aplicada — cria-se outra (mesma lógica do histórico do Git).

## Se o banco remoto mudar por fora

Se alguém alterar o schema pelo dashboard, traga a diferença para o repo com
`supabase db pull` e commite a migration gerada, para o repositório voltar a ser
a fonte de verdade.

## Segredos

- `supabase/.env` **não** é versionado (ver `.gitignore`).
- A `service_role key` fica apenas em `backend/.env` (também fora do Git).
- `project_id`/`project-ref` não são segredos — podem ficar versionados.
