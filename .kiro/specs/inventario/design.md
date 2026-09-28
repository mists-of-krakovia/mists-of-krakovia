# Design — Sistema de Inventário / Itens

Baseado em `requirements.md`. Todas as decisoes de design ja foram aprovadas pelo
dono; este documento fixa a arquitetura.

---

## 1. Modelo de dados

### 1.1 `items` (ja existe — estender)
Colunas atuais: `id, slug, name, item_type, description, is_equippable,
equipment_slot, weight, stats (jsonb), requirements (jsonb), is_tradeable,
rarity`.

Adicoes (migration):
```
ALTER TABLE items ADD COLUMN base_value integer NOT NULL DEFAULT 0;  -- R8, economia 🔮
ALTER TABLE items ADD COLUMN is_stackable boolean NOT NULL DEFAULT false;
ALTER TABLE items ADD COLUMN is_corrupted boolean NOT NULL DEFAULT false; -- 🔮 (so flag)
ALTER TABLE items ADD COLUMN corruption jsonb NOT NULL DEFAULT '{}';      -- 🔮 (penalidade/mutacao)
```
Convencao de `stats` (bonus DIRETO a derivados; chaves = colunas de
`character_derived`):
```
weapon (main_hand): { "attack_melee": 4, "accuracy": 2 }            -- so soma
weapon fogo:        { "attack_ranged": 5, "accuracy": 1 }
armor  (chest):     { "defense": 3, "hp_max": 5 }                   -- so soma
accessory:          { "crit_chance": 2 } / { "mist_resistance": 3 }
```
Convencao de `requirements`:
```
{ "str_mg": 4 }                              -- Modificador Grande minimo de FOR
{ "skill": "armaduras_pesadas", "level": 1 } -- pericia minima
```
> Equipamento normal **nunca reduz** derivado (R1). O campo `corruption` (🔮) e onde
> futuros itens Corrompidos declararao penalidades (`{ "mods": { "evasion": -4 },
> "mutation_per_turn": 1 }`) — inerte neste spec.

### 1.2 `character_inventory` (ja existe — reutilizar)
`(id, character_id, item_id, quantity, durability, is_equipped, equipped_slot,
acquired_at)`. Sem alteracao de schema. Convencoes:
- Stackaveis (`items.is_stackable`): 1 linha por `(character_id, item_id)`,
  `quantity` acumula. **Empilhamento garantido na camada de aplicacao** (grantLoot e
  acoes leem a linha existente do stackavel e somam `quantity`, senao inserem). NAO
  usamos indice unico: um indice parcial `WHERE is_equipped = false` barraria tambem
  equipaveis repetidos na mochila, e o predicado nao pode referenciar
  `items.is_stackable` (outra tabela). A migration `inventory_stack_unique_index`
  fica como no-op marcando essa decisao.
- Equipaveis: 1 linha por unidade (`quantity = 1`), para permitir equipar/durabilidade
  individual no futuro.
- `durability` fica `null` (desgaste adiado, R6).

### 1.3 `enemy_catalog.loot_table` (ja existe — popular via seed)
Formato ja esperado por `services/loot.js`:
```
[{ "item_slug": "faca_enferrujada", "chance": 0.25, "min": 1, "max": 1 }, ...]
```

### 1.4 Enum `item_rarity` (recriar)
Postgres nao permite reordenar enum trivialmente. Migration adiciona os novos
valores de forma aditiva (sem recriar o tipo, para nao quebrar a coluna default):
```
ALTER TYPE item_rarity ADD VALUE IF NOT EXISTS 'epic'      AFTER 'rare';
ALTER TYPE item_rarity ADD VALUE IF NOT EXISTS 'legendary' AFTER 'epic';
```
> O valor `unique` atual permanece no enum (nao da pra remover valor de enum sem
> recriar o tipo). CONSTATADO no remoto: ja existem 2 itens `unique` narrativos
> pre-existentes (`diario_edric_holt`, `placa_do_guarda`) — ou seja, `unique` NAO
> esta orfao, esta em uso por conteudo de missao/documento. Decisao: **manter
> `unique`** como esta (nao remexer nesse conteudo). A escala de raridade de
> equipamento (common/uncommon/rare/epic/legendary) convive com `unique` reservado a
> itens narrativos. `ADD VALUE` nao roda dentro de bloco de transacao com uso
> imediato — a migration usa statements separados.
> **MVP semeia apenas equipamento `common` e `uncommon`.**

---

## 2. Camada de bônus de equipamento (arquitetura — R5)

Decisao (robustez + clareza de origem): **derivados em camadas, equipamento
calculado on-the-fly**, NAO persistido em `character_derived`.

- `character_derived` continua sendo **base (formula dos atributos) + level_bonus**
  (como hoje). Nunca escrevemos bonus de equipamento la.
- Um modulo puro `services/equipment.js` expoe `equipmentBonus(equippedItems)` que
  soma os `stats` dos itens equipados e retorna um mapa `{ derivado: soma }` +
  metadados de origem.
- Onde o total e necessario:
  - **Exibicao (frontend)**: o payload de `/enter` (e um novo `/characters/:id`)
    inclui `derived` (base+nivel) **e** `equipmentBonus` (camada), para a UI mostrar
    "Defesa 12 (8 base +4 equip)". Origem explicita para o jogador (R5).
  - **Combate**: `buildPlayerParticipant` recebe os itens equipados e soma a camada
    no snapshot inicial (o snapshot ja e o lugar dos modificadores de combate).

Por que on-the-fly (e nao persistir):
- Uma unica fonte da verdade por camada; equipar/desequipar nao precisa reescrever
  `character_derived` nem arriscar dessincronizar com `level_bonus`.
- Trocar de item e recalcular e O(itens equipados) ~ trivial; nao ha ganho real em
  materializar.
- Mantem `character_derived` semanticamente limpo (base+nivel), o que ja e assumido
  por `attributes/allocate` e pelo level-up.

Helper de origem (para UI e debug): `equipmentBonus` retorna tambem
`bySource: [{ slot, item_slug, mods }]` para rastrear de onde vem cada ponto.

### 2.1 Requisitos ao equipar
`services/equipment.js` -> `canEquip(item, attributes, skillLevels)`:
- `requirements.str_mg` (etc.) comparado com `mgOf(atributo)`.
- `requirements.skill` comparado com o nivel da pericia do personagem.
- Retorna `{ ok, reason }`. Usado pela rota de equipar e pela UI (item elegivel/nao).

### 2.2 Penalidade de sobrepeso (R7)
`services/equipment.js` -> `weightPenalty(totalWeight, carryCapacity)`:
- `<= capacidade`: sem penalidade.
- `> capacidade`: penalidade **pesada** aplicada como camada negativa aos derivados
  (proposta calibravel): Velocidade e Evasao reduzidas em proporcao ao excesso
  (ex.: `-2 Velocidade e -3 Evasao por 10% de excesso`), com piso; acima de ~150%
  da capacidade, bloqueio de fuga/acoes de mobilidade em combate. Numeros exatos
  ficam como constantes calibraveis no modulo.
- Aplicada tanto na exibicao quanto no combate (mesma camada), com origem
  "sobrepeso" distinguivel.

---

## 3. Backend

### 3.1 `services/equipment.js` (novo, funcoes puras)
- `equipmentBonus(equippedItems)` -> `{ totals, bySource }`.
- `canEquip(item, attributes, skillLevels)` -> `{ ok, reason }`.
- `weightPenalty(totalWeight, carryCapacity)` -> `{ mods, level }` (mods negativos).
- `totalWeight(inventoryRows)` -> numero.
- Reutiliza `mgOf` de `services/character.js`.

### 3.2 `services/loot.js` — `grantLoot` real (R3)
Assinatura passa a `grantLoot(supabase, characterId, drops)`:
1. Resolve `item_slug -> { id, is_stackable }` (query em `items` por slugs dos drops).
2. Para stackaveis: `upsert` incrementando `quantity` (le linha existente e soma; ou
   `on conflict` com o indice unico parcial).
3. Para equipaveis: `insert` de N linhas (`quantity 1`).
4. Retorna os drops concedidos enriquecidos (`name`, `rarity`) para o payload.
> O loop `rollLoot` ja existe e permanece. So `grantLoot` sai de stub.

### 3.3 `routes/inventory.js` (novo) — acoes fora de combate (R4)
Todas autenticadas e com checagem de propriedade (padrao ja usado):
- `POST /characters/:id/inventory/equip`   `{ inventoryId }`
- `POST /characters/:id/inventory/unequip` `{ inventoryId }`
- `POST /characters/:id/inventory/use`      `{ inventoryId }` (consumivel fora de combate)
- `POST /characters/:id/inventory/discard`  `{ inventoryId, quantity? }`

Regras equip: valida `canEquip`; se o slot ja tem item, desequipa o anterior
(volta pra mochila = `is_equipped=false, equipped_slot=null`); grava
`is_equipped=true, equipped_slot=item.equipment_slot`. Nao recalcula
`character_derived` (camada e on-the-fly).

Regra use (consumivel fora de combate): aplica efeito (ex.: `pocao_cura` restaura
PV ate o teto atual = base+nivel+equip), decrementa `quantity` (remove linha a 0).

### 3.4 `routes/characters.js` — payloads
- `/enter`: incluir no retorno `equipmentBonus` e `weightPenalty` (camadas), alem do
  `inventory` (ja presente) com `items.stats`, `is_equippable`, `equipment_slot`,
  `is_stackable`, `rarity`, `base_value`.
- Combate ja recebe o personagem; ver 3.5.

### 3.5 Combate — equipamento e consumiveis (R5, R6)
- `services/combat.js` `buildPlayerParticipant(character, derived, skills, slot,
  attributes, equipmentTotals, weightMods)`: soma `equipmentTotals` e subtrai
  `weightMods` no `stats` do snapshot (documentado como camada). Assinatura estendida
  de forma retrocompativel (parametros novos opcionais).
- `routes/combat.js`: ao montar o participante-jogador, carrega os itens equipados e
  passa a camada. Nova acao **Usar Item**:
  - `POST /combat/:sessionId/item { inventoryId }` — valida consumivel + posse,
    aplica efeito no snapshot (cura/etc.), decrementa `quantity` no
    `character_inventory` e gasta o turno/acao conforme regra do motor.
- **Custo de item das habilidades (R6):** ao listar habilidades disponiveis
  (`abilities.availableAbilities`), cruzar com o inventario: habilidade com
  `req_item` sem unidade no inventario fica indisponivel (motivo "sem <item>"). Ao
  resolver a habilidade com sucesso, decrementar 1 do item. Mapeamento por
  `abilities_catalog.effect.req_item` (adicionar essa chave no seed das 4
  habilidades) ou tabela de-para no codigo. Preferir `effect.req_item` (dado, nao
  codigo). Slugs: `granada_quimica`, `frasco_veneno`, `pocao_cura`, `granada_gas`.

---

## 4. Frontend

### 4.1 `services/api.js`
- `inventoryService.equip/unequip/use/discard`.
- `combatService.useItem(sessionId, inventoryId)`.

### 4.2 `pages/Game.jsx`
- `EQUIPMENT_SLOTS`: passar de 7 para **9** (`accessory` -> `accessory_1`,
  `accessory_2`). Ajustar labels.
- Pagina **Inventario**: adicionar botoes por item (Equipar/Desequipar/Usar/
  Descartar) chamando as rotas; recarregar estado apos acao. Mostrar bonus do item.
- Tela **Personagem**: exibir derivados com origem (base+nivel+equip) usando
  `equipmentBonus` do payload; indicar sobrepeso com destaque de perigo.
- Barra de peso: quando `> carry_capacity`, estado de perigo + aviso da penalidade.

### 4.3 `pages/Combat.jsx`
- Acao **Usar Item** no menu de acoes (lista consumiveis do inventario).
- Painel de habilidades: habilidade sem item requerido aparece desabilitada com o
  motivo (reusa o padrao de cooldown/indisponivel ja existente).

---

## 5. Migrations (ordem)
1. `expand_item_rarity` — `ADD VALUE 'epic'`, `'legendary'` (statements separados).
2. `extend_items_columns` — `base_value, is_stackable, is_corrupted, corruption`.
3. `inventory_stack_unique_index` — indice unico parcial para stackaveis.
4. `seed` — popular `items` (so common/uncommon), `loot_table` dos 3 inimigos e
   `req_item` no `effect` das 4 habilidades. Fonte canonica em `supabase/seed.sql`
   (idempotente, ON CONFLICT). Aplicacao dos ITENS via script Node
   `backend/scripts/seed-items.js` (upsert por slug pela REST, sem abrir porta —
   evita o Avast). `loot_table`/`req_item` idem em scripts equivalentes (Sub-partes
   B/E). `db push --include-seed` existe mas reprocessaria o seed inteiro; usamos os
   scripts Node por seguranca/consistencia com a maquina.

> Slot de acessorio: o item declara `equipment_slot = 'accessory'` (generico). A rota
> de equipar resolve para `accessory_1` ou `accessory_2` (primeiro slot livre). Os
> demais itens declaram o slot exato (`main_hand`, `chest`, `off_hand`, ...).

> Avisar o dono antes de `db push` (regra de trabalho). Seed dos itens roda por
> script Node (REST), nao por `db push`.

---

## 6. Verificacao
- Lint frontend (0 erros) + build.
- Sintaxe backend (`node --check`) dos modulos novos/alterados.
- e2e (dono sobe o servidor): caçar -> loot real no inventario; equipar arma/armadura
  e ver derivado subir com origem; usar pocao (fora e em combate); habilidade
  Granada/Veneno/Pocao indisponivel sem item e consumindo com item; sobrepeso
  penalizando. Limpar dados de teste do remoto ao fim.

---

## 7. Registrado como 🔮 (nao implementado aqui)
- Itens Corrompidos (flag/`corruption` existem, inertes) e a stat de **Mutacao**.
- Fabricacao (destrava epic/legendary), economia/moeda/loja/comercio, durabilidade.
- Regras de duas maos/duas armas por classe.
