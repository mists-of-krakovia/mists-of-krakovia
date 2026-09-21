# Mists of Krakóvia — Estado do Projeto

Documento de handoff. Atualizado durante o Spec 2 (Combate + Progressão) —
Sub-partes A (motor de turnos) e C (nível/XP) concluídas e testadas, mais
ajustes de balanceamento, criação simplificada e fluxo de derrota.

---

## 1. Visão geral

RPG multiplayer de exploração baseado em navegação por nós, com forte ênfase
narrativa. Pilares: exploração e informação são a recompensa; a Névoa é o
antagonista; o mundo existe independente do jogador; mistério antes de respostas.
(Fontes de design: PDFs em `docs/`.)

Stack:
- **Backend**: Node + Express 5, `@supabase/supabase-js` (service key), CORS.
- **Frontend**: React 19 + Vite, React Router, Axios.
- **Banco**: Supabase (Postgres + Auth), schema versionado via Supabase CLI em
  `supabase/migrations/`.

---

## 2. Ambiente de desenvolvimento (Windows, específico desta máquina)

- **Git/GitHub**: repo `mists-of-krakovia/mists-of-krakovia`. Autor local:
  `mists-of-krakovia <robervalad@gmail.com>` (config local, não global).
  Auth via Git Credential Manager (sem token embutido). SSL do git = `schannel`.
- **Docker**: instalado em `C:\Users\Roberval\AppData\Local\Programs\DockerDesktop`
  (path já no PATH do usuário). Necessário para `supabase db pull/push`.
- **Supabase CLI**: v2.x. `project-ref` = `zinifaiuqpkdcqpnrzvz`.
- **Antivírus (Avast)**: faz inspeção TLS. O Node não confia na cadeia reassinada
  sem apontar o CA. Solução em uso:
  - `NODE_EXTRA_CA_CERTS = C:\Users\Roberval\.krakovia-certs\avast-root.pem`
    (caminho SEM acento — o acento em "Krakóvia" quebra o CLI do Supabase).
  - Pasta do projeto está nas exceções do Avast.
  - **Pendência conhecida**: o Avast mata processos `node.exe` que abrem porta de
    rede quando iniciados pelo agente (intermitente). Testes e2e que sobem servidor
    são feitos manualmente pelo usuário. Adicionar `node.exe` às exceções de
    processo do Avast resolveria.
- **Segredos**: `backend/.env` e `frontend/.env` fora do Git (`.gitignore`).
  `.env.example` versionados. Service key já rotacionada.

### Como rodar
```powershell
# backend (porta 3001)
cd backend ; node server.js
# frontend
cd frontend ; npm run dev
```

### Fluxo de banco (migrations)
```powershell
supabase migration new <descricao>   # escreve o SQL
supabase db push                     # aplica no remoto
git add supabase/migrations ; git commit ; git push
```

---

## 3. O que ESTÁ FEITO

### Fundação (commits 19dca2f … 90daf14)
- Versionamento Git + GitHub + Supabase sincronizados; segredos protegidos.
- Schema remoto versionado (migration inicial fiel: 25 tabelas, 13 ENUMs, RLS,
  triggers, grants).
- **Sanidade** virou o 6º atributo base (corrigido bug do CHECK/DEFAULT).
  `services/character.js` calcula derivados usando MP_SAN (R.Mental = SAN×3,
  R.Névoa = SAN×2, carga = MG_FOR×10).
- Início do personagem em **Ironfall** por lookup de `description_key`
  ('ironfall_central'), sem UUID hardcoded.
- `GET /world/clock` retorna `current_weather`.
- Correção crítica: cliente Supabase service_role era contaminado por
  `signInWithPassword` (RLS voltava a valer). Isolados: `server.js` (dados,
  sem sessão), `routes/auth.js` (authClient dedicado), `services/auth.js`
  (validação de token sem sessão). Isso consertou criação e movimento.
- Lint do frontend limpo (0 erros).

### Jogo jogável hoje
- Registro/login (email+senha), seleção e **criação de personagem** (4 etapas:
  classe → nome+atributos → perícias → confirmação).
- Entrar no mundo (Ironfall), intro no primeiro login, **movimento entre nós**
  com custo de estamina, relógio dia/noite + clima, narração dinâmica.
- Presença online por heartbeat.

### Spec 1 — Perícias (commit a242e4f) — CONCLUÍDO
- Tabela `skills_catalog` com **22 perícias** (11 campo + 11 combate), cada uma
  com atributo base, requisito de MG, flag de treinamento e **descrição** fiel ao
  Volume III. "Armas Brancas Industriais" foi removida (absorvida por Leves).
- Colunas `field_skill_points` / `combat_skill_points` em `character_attributes`.
- Backend: `GET /skills/catalog`; criação semeia as 3 perícias iniciais da classe
  (nível 2) + aplica alocação + grava pontos restantes; `POST
  /characters/:id/skills/allocate` (valida propriedade, requisito de atributo,
  teto nível 10, pontos disponíveis).
- Pontos iniciais: campo = `1 + MG_INT`, combate = `3`.
- Frontend: etapa de perícias na criação (abas, contadores, requisitos, iniciais
  fixas nível 2) e **página Perícias in-game interativa** (distribui pontos).
- Descrições reais dos 6 atributos exibidas na criação.
- Verificado: lint 0, build ok, e2e do backend (rodado antes das travas do Avast)
  passou; usuário validou e integrou.

### Perícias iniciais por classe (nível 2)
- vagante_nevoas: armas_brancas_leves, armas_fogo_leves, armaduras_leves
- arauto_conclave: dispositivos_combate, armaduras_leves, medicina_combate
- exilado_ferro: armas_brancas_pesadas, armaduras_pesadas, escudos_bloqueio
- confessor_veu: medicina_combate, armaduras_leves, armas_brancas_leves
- cronista_ruinas: armas_fogo_leves, armaduras_leves, armas_brancas_leves

---

## 4. O que FALTA (pendências e próximos blocos)

### Decisões de design já tomadas
- Combate = modelo `classes_v2`: **cooldown por Velocidade, sem stamina de combate**.
- Nível/XP feito junto com o Combate (Sub-parte C, CONCLUÍDA): combate gera XP;
  level-up credita **+3 atributo, +1 combate, +1 campo** por nível + bônus de
  derivados por classe (cura ao upar). Curva `100×N^1.7`, teto nível 10.
- Criação **sem etapa de perícias** (decisão pós-teste): só as 3 da classe (nv2)
  + `1+MG_INT` de campo disponível; combate inicial = 0. Distribuição só por nível.
- Início em Ironfall mantido por enquanto (é o nó introdutório; a "primeira cidade
  grande", Novaya Veles no cânone, virá depois, maior).
- Terminologia: **Perícia ≠ Habilidade**. Perícias (character_skills) são
  treinamento com nível 0–10. Habilidades de classe (Volume V, com cooldown) são
  desbloqueadas por nível e dependem de perícias como pré-requisito; serão
  modeladas no spec de Combate.

### Spec 2 — COMBATE + PROGRESSÃO — Sub-partes A e C CONCLUÍDAS (testadas e2e)
Spec completo em `.kiro/specs/combate/`. Modelo confirmado: só Ataque Rápido e
Forte ativos; Precisão/Área desligados; reações Bloquear/Desviar às cegas com
matchup (matchup certo = dano 0; bloqueio errado ainda mitiga; desvio errado
falha); contra-ataque automático ×1.5 pós-reação-correta (flag por classe, hoje
todas true — meta futura só Vagante). Ações adicionais por Velocidade ativas.

**Banco (migrations 20260921120000–140000, aplicadas no remoto):**
- `enemy_catalog` (bestiário futuro), `combat_participants` (party-ready),
  `combat_sessions`/`combat_turns` recriadas multi-combatente, `node_spawns`
  (spawn na ligação nó↔inimigo), `world_nodes.encounter_rate`,
  `character_derived.level_bonus` (bônus de nível separado da fórmula),
  `characters.respawn_points` (histórico de 10 pontos salvos).
- Enums: `combat_side`, `spawn_type`, `enemy_ai`; `combat_status` generalizado.
- Seed: 3 inimigos iniciais (rato_da_bruma/vagante_corrompido/sabujo_de_ferro,
  xp 15/20/25) rebalanceados + spawns por tipo de nó.

**Backend:** `services/combat.js` (motor: iniciativa, resolveAttack/Reaction/
Counter, IA attacker_simple, narração rica), `routes/combat.js` (hunt/get/action/
react/flee + reação pendente + log de turnos + recompensas), `services/
progression.js` (curva 100×N^1.7, teto 10, +3 atr/+1 comb/+1 campo por nível,
bônus de derivados por classe, cura ao upar), `services/loot.js` (loop pronto,
`grantLoot` STUB até o spec de itens).

**Frontend:** `pages/Combat.jsx`+css (overlay: ordem de turno, HP, ação
Rápido/Forte/Passar/Fugir, overlay de reação, log narrativo do servidor, telas
de fim com XP/level-up/derrota). Botão **Caçar** e **Salvar progresso** no nó.
Tela de Personagem com distribuição interativa de atributos.

**Ajustes pós-teste aplicados:**
- Criação simplificada: SEM etapa de perícias (fluxo 3 etapas). Nasce só com as
  3 perícias da classe (nv2) + `field_skill_points = 1+MG_INT`, combate = 0.
- Level-up credita +3 atributo, +1 combate, +1 campo (era +(1+MG_INT) campo).
- Bônus de derivados por classe ao subir de nível (tabela em `character.js`
  `LEVEL_UP_BONUS_BY_CLASS`), guardado em `level_bonus`; cura HP/estamina ao upar.
- HP persiste no valor do fim da luta (piso 1); level-up sobrescreve com cura.
- **Fluxo de derrota**: respawn no último ponto salvo (ou Ironfall), −10% do
  `xp_to_next` (piso 0, sem regredir nível), −20 estamina (piso 0), revive 50% HP.
- **Salvar ponto** (`POST /characters/:id/save-point`): só em settlement, guarda
  histórico de 10 (mais recente primeiro), dedupe.
- Contra-ataque com flag por classe (todas true na fase de teste).

**Testado e2e (servidor no ar):** criação, caçar, vitória+XP, level-up (pontos +
cura), alocar atributos (recalcula derivados preservando bônus), derrota+respawn
+penalidades, salvar ponto. Todos passaram; dados de teste limpos do remoto.

### FALTA no Spec 2 (próximas sub-partes)
- (b) **Habilidades de classe nv1–3** (tabela `abilities_catalog`, cooldown por
  Velocidade, passivas nv1). Suporte-a-aliado inerte até haver party.
- (d) **Exposição à névoa em combate** (acúmulo/penalidade/persistência).
- (e) **Encontro automático ao mover** (atrás de flag `ENCOUNTERS_ON_MOVE`).

### Outras pendências menores (backlog, fora de spec ainda)
- **Excluir personagem** (rota DELETE + botão na seleção) — pedido pelo usuário e
  pelo doc de interface, ainda NÃO implementado.
- **Regeneração de estamina** (doc define regen; hoje só decresce).
- **Ações de inventário** (equipar/usar/descartar) — hoje só leitura.
- **OAuth Google / "esqueci a senha"** — login é só email+senha.
- **Diálogo NPC + confiança/reputação**: CONFLITO a resolver — schema usa árvore
  de diálogo (dialogue_*), mas doc de interface pede motor de palavras-chave +
  confiança. Decidir antes de implementar.
- **Produção/coleta por uso** (skill_type 'production' já existe no enum).
- Dívida técnica: fórmula de `crit_chance` e outras derivadas podem precisar de
  ajuste fino de balanceamento conforme o combate for testado.

---

## 5. Arquivos-chave

- Backend: `backend/server.js`, `backend/routes/{auth,characters,world,skills}.js`,
  `backend/services/{auth,character,skills}.js`.
- Frontend: `frontend/src/pages/{Login,Characters,Game}.jsx`,
  `frontend/src/context/GameContext.jsx`, `frontend/src/services/api.js`.
- Banco: `supabase/migrations/*.sql`, `supabase/seed.sql`, `supabase/README.md`.
- Specs: `.kiro/specs/pericias/{requirements,design,tasks}.md`.
- Docs de design (fonte de verdade): `docs/*.pdf`.
