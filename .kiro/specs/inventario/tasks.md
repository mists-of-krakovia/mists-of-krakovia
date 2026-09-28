# Tarefas — Sistema de Inventário / Itens

Implementacao incremental. **Uma sub-parte por vez**, cada uma com verificacao
(lint/build/`node --check`) e revisao do dono antes de seguir. Sem `git commit`
sem pedido; `git add` por arquivo. Avisar antes de `db push`.

Ordem: A -> B -> C -> D -> E.

---

## Sub-parte A — Catalogo de itens + schema + seed
Base de tudo. Sem isto, loot e equipamento nao tem o que conceder.

- [ ] A1. Migration `expand_item_rarity`: `ADD VALUE 'epic'` e `'legendary'`
      (statements separados; `IF NOT EXISTS`). Documentar `unique` orfao.
- [ ] A2. Migration `extend_items_columns`: `base_value int default 0`,
      `is_stackable bool default false`, `is_corrupted bool default false`,
      `corruption jsonb default '{}'`.
- [ ] A3. Migration `inventory_stack_unique_index`: no-op (marcador). Empilhamento de
      stackaveis fica na camada de aplicacao (ver design §1.2 — indice unico parcial
      barraria equipaveis repetidos e nao pode referenciar `items.is_stackable`).
- [ ] A4. Definir a convencao de `stats`/`requirements`/`base_value` (ja no design)
      e escrever o **seed** dos itens do MVP (so `common`/`uncommon`): armas
      (branca leve/pesada, fogo leve), armaduras (head/chest/hands/legs),
      acessorios, consumiveis (`pocao_cura`, `frasco_veneno`, `granada_quimica`,
      `granada_gas`), recursos de loot. Script Node idempotente (upsert por slug).
- [ ] A5. Aplicar migrations (avisar antes do `db push`) e rodar o seed via Node
      (`NODE_EXTRA_CA_CERTS`, sem abrir porta). Conferir contagem/valores no remoto.
- [ ] A6. Verificacao: sintaxe do script de seed; conferir `items` populada.
- [ ] **Revisao do dono.**

## Sub-parte B — Loot real (destrava o stub)
- [ ] B1. Popular `enemy_catalog.loot_table` dos 3 inimigos iniciais (seed/migration),
      referenciando slugs criados em A (consumiveis/recursos comuns).
- [ ] B2. Implementar `grantLoot(supabase, characterId, drops)` real em
      `services/loot.js` (resolve slug->id, empilha stackaveis, insere equipaveis,
      retorna drops enriquecidos). `rollLoot` permanece.
- [ ] B3. Ligar no `routes/combat.js` o payload de recompensa aos itens concedidos
      (o loop ja existe; passar `supabase`/`characterId`).
- [ ] B4. Verificacao: `node --check`; e2e leve (dono sobe servidor): caçar e ver
      item cair no inventario.
- [ ] **Revisao do dono.**

## Sub-parte C — Acoes de inventario (fora de combate)
- [ ] C1. `services/equipment.js` (novo): `equipmentBonus`, `canEquip`,
      `weightPenalty`, `totalWeight` (funcoes puras; reusa `mgOf`).
- [ ] C2. `routes/inventory.js` (novo): equip/unequip/use/discard, com propriedade e
      validacao (`canEquip`, slot unico, consumo de consumivel). Registrar no
      `server.js`.
- [ ] C3. `services/api.js`: `inventoryService` (equip/unequip/use/discard).
- [ ] C4. `pages/Game.jsx`: 9 slots (`accessory_1/2`), botoes de acao na pagina
      Inventario, recarregar estado apos acao.
- [ ] C5. Verificacao: lint + build frontend; `node --check` backend; e2e: equipar,
      desequipar, usar pocao fora de combate, descartar.
- [ ] **Revisao do dono.**

## Sub-parte D — Equipamento afeta os derivados
- [ ] D1. `/enter` (e `/characters/:id` se necessario) inclui `equipmentBonus` e
      `weightPenalty` no payload (camadas, com origem `bySource`).
- [ ] D2. `combat.js` `buildPlayerParticipant`: parametros opcionais
      `equipmentTotals`/`weightMods`; somar/subtrair no snapshot. `routes/combat.js`
      carrega os itens equipados e passa a camada.
- [ ] D3. Frontend: tela Personagem exibe derivado com origem (base+nivel+equip) e
      destaca sobrepeso; barra de peso em estado de perigo acima da capacidade.
- [ ] D4. Verificacao: lint + build; `node --check`; e2e: equipar sobe o derivado no
      combate e na tela; sobrepeso penaliza.
- [ ] **Revisao do dono.**

## Sub-parte E — Consumiveis em combate + custo de item das habilidades
- [ ] E1. Seed: adicionar `effect.req_item` nas 4 habilidades (Granada Quimica ->
      `granada_quimica`; Ataque Envenenado -> `frasco_veneno`; Pocao em Area ->
      `pocao_cura`; Gas Paralisante -> `granada_gas`).
- [ ] E2. `abilities.availableAbilities`: cruzar com inventario; habilidade com
      `req_item` sem unidade fica indisponivel (motivo). Ao resolver com sucesso,
      decrementar 1 do item (persistir no `character_inventory`).
- [ ] E3. Acao **Usar Item** no combate: `POST /combat/:sessionId/item`
      `{ inventoryId }` (valida consumivel + posse, aplica efeito, decrementa,
      gasta a acao). `combatService.useItem` no frontend + botao em `Combat.jsx`.
- [ ] E4. Frontend: habilidade sem item aparece desabilitada com motivo (reusa
      padrao de cooldown).
- [ ] E5. Verificacao: lint + build; `node --check`; e2e: habilidade indisponivel
      sem item, consumindo com item; Usar Item cura em combate. Limpar dados de teste.
- [ ] E6. Atualizar `docs/md/volume-v-classes.md` (remover 🔮 do custo de item) e o
      `ESTADO_DO_PROJETO.md`.
- [ ] **Revisao do dono.**

---

## Notas de execucao
- Verificacao por sub-parte antes de pedir revisao (regra de trabalho).
- Seed sempre por script Node (REST), nunca via `db push`.
- Avisar antes de qualquer `db push` e antes de operacao destrutiva no banco.
- MVP: semear apenas `common`/`uncommon`. `rare/epic/legendary` so no enum + regras.
- Itens Corrompidos / Mutacao: NAO implementar (so as colunas inertes de A2).
