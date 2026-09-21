# Design — Combate por Turnos + Progressão de Nível/XP

Baseado em `requirements.md`. Estruturado nas 4 sub-partes:
(a) motor de turnos + ataque/dano/reações; (b) habilidades de classe nv1–3;
(c) level-up/XP; (d) exposição à névoa.

Convenções herdadas: escritas no banco via cliente **service_role** (RLS ignorada),
mesmo padrão já corrigido na Fundação; SELECT do jogador respeita RLS existente.
Helpers `mpOf`/`mgOf` já existem em `services/character.js` (reutilizar).

---

## 1. Modelo de dados

### 1.1 Novos ENUMs / alterações de ENUM
```
-- novo
CREATE TYPE combat_side AS ENUM ('ally', 'enemy');
CREATE TYPE spawn_type  AS ENUM ('random', 'conditional', 'guaranteed');
CREATE TYPE enemy_ai     AS ENUM ('attacker_simple', 'defensive', 'caster'); -- só 'attacker_simple' usado agora

-- combat_status: hoje ('active','player_won','player_lost','fled').
-- Generalizar para party. Como as tabelas de combate serão recriadas (vazias),
-- recriar o enum: ('active','allies_won','enemies_won','fled','abandoned').

-- combat_actor ('player','enemy'): DEIXA DE SER USADO por combat_turns
-- (turnos passam a referenciar combat_participants.id). Pode ser dropado junto
-- com a recriação, ou mantido inerte. Design: dropar na recriação.
```

### 1.2 `enemy_catalog` (nova — migration + seed)
"Molde" dos inimigos; base do bestiário futuro.
```
enemy_catalog(
  slug            varchar PK,          -- ex.: 'errante_da_bruma'
  name            varchar,
  level           integer,
  hp_max          integer,
  attack          integer,             -- valor de Ataque base do inimigo
  defense         integer,
  speed           integer,             -- iniciativa / ações adicionais
  accuracy        integer,
  evasion         integer,
  crit_chance     numeric(5,2) DEFAULT 3,
  crit_damage     numeric(5,2) DEFAULT 150,
  mist_resistance integer DEFAULT 0,
  xp_reward       integer NOT NULL,    -- 15–25 nos iniciais
  ai_profile      enemy_ai DEFAULT 'attacker_simple',
  attack_types    jsonb DEFAULT '["quick","strong"]',  -- tipos que o inimigo usa
  abilities       jsonb DEFAULT '[]',  -- habilidades especiais (inerte p/ iniciais)
  is_rare         boolean DEFAULT false,        -- reservado bestiário
  spawn_conditions jsonb DEFAULT '{}',          -- reservado (condição global do mob)
  loot_table      jsonb DEFAULT '[]',           -- reservado (fora deste spec)
  description     text
)
```
RLS: SELECT público (leitura de catálogo), grants padrão. Escrita só service_role.

### 1.3 `combat_participants` (nova) — quem está no combate
Uma linha por combatente. É o que habilita party/multi-alvo.
```
combat_participants(
  id            uuid PK DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES combat_sessions(id) ON DELETE CASCADE,
  side          combat_side NOT NULL,           -- 'ally' | 'enemy'
  character_id  uuid NULL REFERENCES characters(id),   -- se for jogador
  enemy_slug    varchar NULL REFERENCES enemy_catalog(slug), -- se for inimigo
  display_name  varchar NOT NULL,
  level         integer NOT NULL DEFAULT 1,
  hp_max        integer NOT NULL,
  hp_current    integer NOT NULL,
  stats         jsonb NOT NULL,   -- snapshot: attack_melee, attack_ranged, defense,
                                  -- speed, accuracy, evasion, crit_chance,
                                  -- crit_damage, mist_resistance, skills relevantes
  effects       jsonb NOT NULL DEFAULT '[]', -- efeitos temporários DO combate
                                  -- (veneno, buffs); inimigos usam só isto
  cooldowns     jsonb NOT NULL DEFAULT '{}', -- {ability_slug: turns_remaining}
  initiative    integer NOT NULL DEFAULT 0,  -- Velocidade p/ ordenar
  extra_actions integer NOT NULL DEFAULT 0,  -- ações adicionais por Velocidade
  reaction_used boolean NOT NULL DEFAULT false, -- gasta ao reagir; reseta na ação
  is_defeated   boolean NOT NULL DEFAULT false,
  slot          integer NOT NULL DEFAULT 0    -- ordem/posição estável
)
```
- CHECK lógico (na app): exatamente um de `character_id` / `enemy_slug` preenchido.
- Efeitos persistentes DO PERSONAGEM continuam em `character_status_effects`
  (fora/dentro de combate). Efeitos temporários que só valem durante o combate
  (inclui os de inimigos) vivem em `combat_participants.effects`.

### 1.4 `combat_sessions` (recriar) — sem campos 1x1
```
combat_sessions(
  id           uuid PK DEFAULT gen_random_uuid(),
  node_id      uuid NOT NULL REFERENCES world_nodes(id),
  initiator_id uuid NULL REFERENCES characters(id),  -- conveniência (dono da sessão)
  status       combat_status NOT NULL DEFAULT 'active',
  round_number integer NOT NULL DEFAULT 1,
  turn_order   jsonb NOT NULL DEFAULT '[]', -- [participant_id, ...] por iniciativa
  active_index integer NOT NULL DEFAULT 0,  -- posição atual em turn_order
  started_at   timestamptz DEFAULT now(),
  ended_at     timestamptz
)
```
Removidos: `enemy_slug`, `enemy_hp_current`, `enemy_hp_max`, `character_id`
(único). Combatentes agora vivem em `combat_participants`.

### 1.5 `combat_turns` (recriar) — referencia participantes
```
combat_turns(
  id           uuid PK DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES combat_sessions(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  turn_number  integer NOT NULL,
  actor_id     uuid NOT NULL REFERENCES combat_participants(id),
  target_id    uuid NULL REFERENCES combat_participants(id),
  action_type  varchar(50) NOT NULL,   -- 'attack_quick','attack_strong',
                                        -- 'ability','flee','pass','react_block',
                                        -- 'react_dodge','counter'
  result       jsonb NOT NULL DEFAULT '{}', -- {hit, crit, damage, mitigated,
                                        -- reaction, matchup_correct, counter, ...}
  created_at   timestamptz DEFAULT now()
)
```
Removidos: `actor`/`target` (enum binário), `hp_after_player`/`hp_after_enemy`.
O HP pós-ação é lido de `combat_participants`; o `result` guarda o detalhamento.

### 1.6 `node_spawns` (nova) — mecânica de spawn na ligação
```
node_spawns(
  id            uuid PK DEFAULT gen_random_uuid(),
  node_id       uuid NOT NULL REFERENCES world_nodes(id),
  enemy_slug    varchar NOT NULL REFERENCES enemy_catalog(slug),
  spawn_type    spawn_type NOT NULL DEFAULT 'random',
  weight        integer NOT NULL DEFAULT 100,  -- peso relativo no sorteio
  min_count     integer NOT NULL DEFAULT 1,    -- prepara party de inimigos
  max_count     integer NOT NULL DEFAULT 1,
  spawn_conditions jsonb NOT NULL DEFAULT '{}',-- {weather, time, chance, ...}
  is_active     boolean NOT NULL DEFAULT true
)
```
Um monstro raro = linha com `spawn_type='conditional'` + `spawn_conditions`.

### 1.7 `world_nodes` — coluna nova (migration)
```
encounter_rate numeric(4,3) NOT NULL DEFAULT 0  -- 0..1, taxa base ao mover
```
Seed inicial por tipo: passage=0.10, field=0.25, mist=0.40 (calibra),
settlement=0, secret=0.

### 1.8 `characters` — reutilizado
`level`, `xp`, `xp_to_next` já existem. Level-up atualiza os três. Sem coluna nova.

---

## 2. Backend

### 2.1 `services/combat.js` (novo) — o motor
Funções puras + orquestração. Sem estado global; opera sobre a sessão + participantes.

- `mpOf`, `mgOf` — reutiliza de `services/character.js`.
- `rollInitiative(participants)` — ordena por `stats.speed` desc; empate por RNG.
  Calcula `extra_actions` por par de velocidades (Vol. III: >=1.5× → +1; >=2× → +2…).
- `buildPlayerSnapshot(character)` — monta `stats`/`hp` a partir de
  `character_derived` + `character_skills` (bônus de perícia de arma/armadura).
- `buildEnemySnapshot(enemyRow, count)` — instancia participantes a partir do
  `enemy_catalog`.
- `resolveAttack({ attacker, defender, type, reaction })` — fluxo Vol. III adaptado:
  1. **Tipo**: `quick` (Ataque ×0.85, +10% acerto) | `strong` (Ataque ×1.25,
     defensor sofre; atacante −3 Velocidade próxima rodada).
  2. **Acerto**: `hitChance = f(accuracy_atacante, evasion_defensor)`; Rápido soma
     +10% acerto.
  3. **Reação do defensor** (se o defensor for o jogador e tiver reação disponível
     — ver 2.2): aplica matchup.
  4. **Crítico**: `crit_chance` do atacante → aplica `crit_damage`.
  5. **Dano**: `dano = round(Ataque×mod_tipo (×crit?) + RNG(1..10) − Defesa_alvo)`,
     mínimo 1; então aplica redução da reação.
  6. **Efeitos**: aplica efeitos da arma/habilidade (veneno etc.) em `effects`.
  7. **Status**: HP<=0 → `is_defeated=true`.
- `resolveReaction({ incomingType, reaction, defender, attacker })`:
  - `dodge` correto contra `quick` → **dano 0**.
  - `block` correto contra `strong` → **dano 0**.
  - `block` errado (contra `quick`) → mitiga: `mitig = periciaBloqueio×2 + defesaArmadura`.
  - `dodge` errado (contra `strong`) → falha, dano total.
  - Retorna `{ mitigation, matchupCorrect }`.
- `resolveCounter({ defender, attacker })` — se `matchupCorrect` **e**
  `counterAttackEnabled(classe)`: dano automático = ataque normal do defensor ×1.5,
  aplicado no atacante. Registra `action_type='counter'`.
  - `counterAttackEnabled(classe)`: config por classe (flag). **Default atual: todas
    `true`** (fase de teste). **Meta futura: só `vagante_nevoas`.** Trocar a config
    não exige mexer no motor.
- `enemyTurn(session, enemy)` — IA `attacker_simple`: escolhe alvo (o jogador),
  escolhe tipo (RNG entre `attack_types`), chama `resolveAttack`. Não reage.
- `advanceTurn(session)` — avança `active_index`/`round_number`; recalcula
  `extra_actions`; decrementa cooldowns; tica exposição de névoa (sub-parte d);
  reseta `reaction_used` do jogador no início da vez dele.
- `checkEnd(session)` — todos `enemy` derrotados → `allies_won` (credita XP);
  todos `ally` derrotados → `enemies_won`; fuga → `fled`.

### 2.2 Modelo de reação (o ponto delicado)
Como a reação acontece **antes de cada ação inimiga** e o jogador escolhe às cegas,
o motor precisa **pausar** e pedir input. Estratégia stateless (sem websocket):

- O turno dos inimigos não resolve tudo de uma vez. Ao chegar a vez de um inimigo
  que vai atacar o jogador, o backend cria/expõe um **estado de "reação pendente"**
  na sessão (ex.: `combat_sessions.pending` jsonb: `{ enemyParticipantId,
  awaiting_reaction: true }`) e retorna ao cliente **sem** resolver o ataque.
- O cliente chama `POST /combat/:id/react` com `{ reaction: 'block'|'dodge'|'pass' }`.
  - `pass` → resolve o ataque sem reação, segue para o próximo inimigo (novo
    `pending` se houver mais).
  - `block`/`dodge` → resolve com matchup; marca `reaction_used=true`; se correto e
    classe elegível, dispara contra-ataque; os inimigos seguintes do ciclo resolvem
    **sem** oferecer reação (reação gasta).
- Quando não há mais inimigos a agir, volta a vez ao jogador; `reaction_used`
  reseta. Isso mantém a "uma reação por ciclo" sem estado de servidor persistente
  além da própria sessão.

> Nota de design: `combat_sessions.pending` (jsonb) é adicionado ao 1.4 para
> carregar esse ponto de sincronização. Alternativa considerada e descartada:
> resolver o ataque e deixar o cliente "desfazer" — frágil e explorável.

### 2.3 Rotas — `routes/combat.js` (novo)
- `POST /combat/hunt` `{ characterId }` — ação **Caçar**. Sorteia de `node_spawns`
  do nó atual (100% por ora); cria `combat_session` + participantes; retorna estado.
- `GET  /combat/:sessionId` — estado atual (participantes, turn_order, pending).
- `POST /combat/:sessionId/action` `{ actorId, action, targetId, abilitySlug? }`
  — ação do jogador no seu turno (attack_quick/strong/ability/flee/pass). Resolve,
  avança, e roda o(s) turno(s) inimigo(s) até surgir uma reação pendente ou o
  fim da rodada.
- `POST /combat/:sessionId/react` `{ reaction }` — ver 2.2.
- `POST /combat/:sessionId/flee` — tentativa de fuga (Velocidade vs. inimigo mais
  rápido; falha → ataque de oportunidade).
- Todas autenticadas; validam propriedade do personagem (padrão já usado).

### 2.4 Encontro ao mover (`routes/characters.js`)
- Após mover, se `ENCOUNTERS_ON_MOVE` (flag em `.env`, default **off**) e o destino
  tem `encounter_rate` > 0 e `node_spawns` ativos: rola encontro; se disparar, cria
  sessão e sinaliza no retorno do `/move`. **Nasce desligado.**

### 2.5 Progressão — `services/progression.js` (novo, sub-parte c)
- `xpToNext(level)` = `round(100 × level^1.7)`.
- `awardXp(character, amount)` — soma XP; enquanto `xp >= xp_to_next` e `level < 10`:
  sobe nível, credita **+3** `points_available`, **+1** `combat_skill_points`,
  **+(1 + MG_INT)** `field_skill_points`, recalcula `xp_to_next`, recalcula
  derivados de HP (via helper de `character.js`). Retorna resumo do level-up.
- Chamado por `checkEnd` quando `allies_won`: soma `xp_reward` dos inimigos
  derrotados e credita ao personagem.

### 2.6 Habilidades de classe nv1–3 (sub-parte b) — `services/abilities.js` (novo)
- Fonte: tabela versionada **`abilities_catalog`** (decisão A) com as habilidades
  níveis 1–3 de cada classe: slug, class_key, tipo (offensive/mobility/control/
  support/reactive/passive), nível de desbloqueio, requisito de perícia, cooldown
  base, `is_ultimate`, e efeito (jsonb). `services/abilities.js` lê essa tabela.
- `effectiveCooldown(base, mpAgi, isUltimate)` = `max(1, floor(base × (1 −
  min(isUltimate?0.20:0.40, mpAgi×0.02))))`.
- Habilidades de **suporte a aliado** (Proteger, Análise de Campo em grupo, Poção
  em Área): modeladas mas **inertes** em 1x1 (sem alvo aliado) — documentado.
- Passivas nv1: aplicadas no snapshot (ex.: Lâmina Afiada +8% crit; Precisão Natural
  +5% crit) e em gatilhos (ex.: Instinto de Fuga quando HP<30%).
- Habilidades nv1–3 por classe (do Volume V):
  - **Vagante**: Navalha Veloz (of, CD3), Passo Silencioso (mob, CD3), Emboscada (of,
    nv3, CD4) + passivas (Instinto de Fuga, Leitura de Névoa, Lâmina Afiada, Sombra
    Persistente).
  - **Arauto**: Granada Química (of, CD3, consome item), Armadilha de Pressão (ctrl,
    CD2), Tiro de Precisão (of, nv3, CD4) + passivas.
  - **Exilado**: Golpe Pesado (of, CD3), Provocação (ctrl, CD4), Golpe de Escudo
    (of/ctrl, nv3, CD4) + passivas.
  - **Confessor**: Ataque Envenenado (of, CD3, consome item), Poção em Área (sup,
    CD3 — inerte solo), Gás Paralisante (of/ctrl, nv3, CD4) + passivas.
  - **Cronista**: Tiro Rápido (of, CD2), Ponto Fraco (of, CD3), Improviso Tático (of,
    nv3, CD4) + passivas.
- **Consumo de itens** (Granada, Veneno): decisão B — no início a habilidade é
  **sempre usável** (não checa item). O custo será ligado quando o spec de itens
  existir. O efeito é anotado no catálogo, mas não bloqueia.

### 2.7 Exposição à névoa (sub-parte d) — dentro de `advanceTurn`
- Se `node.node_type == 'mist'`: por rodada, cada participante `ally` sem proteção
  ganha +1 Exposição; com proteção, +1 a cada `floor(mist_resistance/10)` rodadas.
- Penalidades por faixa aplicadas ao snapshot (1–5: −5% testes; 6–10: −15% +−5 Vel;
  11–15: −30% +−10 Vel + Sanidade; 16+: incapacitação).
- Persiste em `character_derived.mist_exposure` ao fim do combate. Redução fora da
  névoa (1/min) é responsabilidade do relógio/mundo (fora deste spec, anotar).

---

## 3. Frontend

### 3.1 `services/api.js`
- `combatService.hunt(characterId)`, `.get(sessionId)`, `.action(...)`,
  `.react(...)`, `.flee(...)`.
- `enemyService.getCatalog()` opcional (para debug/bestiário futuro).

### 3.2 `pages/Combat.jsx` (nova) + `Combat.css`
- Renderiza: barra de ordem de turno, cartões dos combatentes (HP, efeitos),
  painel de ação no turno do jogador (**Ataque Rápido**, **Ataque Forte**,
  **Habilidade** ▸ lista com cooldown, **Fugir**, **Passar**).
- **Prompt de reação**: quando o estado vem com `pending.awaiting_reaction`, mostra
  overlay [Bloquear] [Desviar] [Deixar passar] identificando o inimigo que vai agir
  (sem revelar o tipo do ataque). Após reagir uma vez, some o prompt para os demais.
- Log de combate (texto narrativo por turno), tela de vitória com XP ganho e aviso
  de level-up (pontos creditados), tela de derrota, e fuga.

### 3.3 `pages/Game.jsx`
- Botão **Caçar** no nó atual → `combatService.hunt` → navega para `Combat`.
- (Encontro ao mover fica desligado por flag; quando ligado, `/move` retornará uma
  sessão e o Game redireciona para `Combat`.)

---

## 4. Migrations (ordem)
1. `combat_enums` — cria `combat_side`, `spawn_type`, `enemy_ai`; recria
   `combat_status` generalizado; dropa `combat_actor`.
2. `recreate_combat_tables` — DROP das antigas `combat_turns`, `combat_sessions`
   (vazias) e CREATE das novas (1.4/1.5) + `combat_participants` (1.3).
3. `create_enemy_catalog` — tabela + RLS SELECT público + grants.
4. `create_node_spawns` — tabela + índices.
5. `add_encounter_rate_to_world_nodes` — coluna + backfill por `node_type`.
6. `create_abilities_catalog` — tabela + RLS SELECT público + grants (decisão A).
7. `seed` — `enemy_catalog` (2–3 monstros iniciais do primeiro mapa, xp 15–25),
   `node_spawns` para os nós de `field`/`passage` iniciais, `encounter_rate`, e
   `abilities_catalog` (habilidades nv1–3 das 5 classes).

Fluxo: `supabase migration new … ; supabase db push ; commit`. **Aviso antes de
qualquer operação destrutiva no banco** (o DROP das tabelas de combate é destrutivo,
ainda que vazias) — pedirei confirmação explícita antes do `db push`.

---

## 5. Questões de design (resolvidas com o usuário)

**A. Catálogo de habilidades → tabela versionada `abilities_catalog`.** [resolvido]
Coerente com `skills_catalog` do Spec 1; permite UI de habilidades e bestiário
lerem como dado. Migration + seed das habilidades nv1–3 das 5 classes.

**B. Habilidades que consomem item (Granada, Veneno, Poção) → custo adiado.**
[resolvido] Testar o fluxo básico primeiro: no início as habilidades são **sempre
usáveis** (sem checagem de item). O consumo de item será ligado depois, quando o
spec de itens de combate existir. O campo/efeito fica anotado, mas não bloqueia.

**C. Fórmula de acerto → aprovada.** [resolvido]
`hitChance = clamp(0.5 + (accuracy − evasion) × 0.03, 0.05, 0.95)`, com **+0.10** no
Ataque Rápido. Ponto de partida calibrável conforme o balanceamento evoluir.

**D. Contra-ataque → todas as classes agora (fase de teste); alvo = exclusivo do
Vagante.** [resolvido] Para testar o loop de defesa em todas as classes, o
contra-ataque automático (×1.5 pós-reação-correta) fica **habilitado para todas** por
enquanto. O **design-alvo é restringir ao Vagante das Névoas**; as demais classes
serão desabilitadas depois da fase de teste. Implementar como uma flag/config por
classe (`counter_attack_enabled`) para facilitar essa transição sem refatorar o
motor. Default atual: todas `true`; meta futura: só Vagante `true`.

**E. Ações adicionais por Velocidade → mantidas ativas.** [resolvido]
Fiel ao Vol. III desde já (é o valor central da Agilidade), mesmo em 1x1.

---

## 6. Verificação (quando implementar — só sob seu pedido)
- Motor: simular combate 1x1 por classe; conferir iniciativa, dano Rápido/Forte,
  matchup de reação (block/dodge certo = dano 0; block errado mitiga; dodge errado
  falha), contra-ataque ×1.5, vitória/derrota/fuga.
- Progressão: derrotar inimigo → XP creditado; forçar acúmulo → level-up credita
  +3 atributo / +1 combate / +(1+MG_INT) campo; `xp_to_next` = round(100×N^1.7);
  trava no nível 10.
- Névoa: em nó `mist`, Exposição sobe por rodada; penalidades por faixa; persiste.
- Frontend: build + lint; fluxo Caçar → Combat → Vitória.
- e2e que sobe servidor: **executado manualmente pelo usuário** (travas do Avast).
