# Tarefas — Combate por Turnos + Progressão de Nível/XP

Ordem de execução por sub-parte. Cada bloco é verificável isoladamente.
Nada é implementado antes da aprovação do spec. Testes só sob pedido explícito.
Confirmação obrigatória antes de operações destrutivas no banco (DROP das tabelas
de combate) e antes de `db push`.

## Sub-parte A — Motor de turnos + ataque/dano/reações

### Banco
- [ ] A1. Migration `combat_enums`: cria `combat_side`, `spawn_type`, `enemy_ai`;
      recria `combat_status` (`active`,`allies_won`,`enemies_won`,`fled`,
      `abandoned`); dropa `combat_actor`.
- [ ] A2. Migration `recreate_combat_tables`: DROP `combat_turns` + `combat_sessions`
      (vazias) e CREATE novas `combat_sessions` (com `pending` jsonb),
      `combat_participants`, `combat_turns`. [DESTRUTIVO — confirmar antes]
- [ ] A3. Migration `create_enemy_catalog` (+ RLS SELECT público + grants).
- [ ] A4. Migration `create_node_spawns` (+ índices por node_id).
- [ ] A5. Migration `add_encounter_rate_to_world_nodes` (coluna + backfill por tipo).
- [ ] A6. Seed: 2–3 inimigos iniciais (xp 15–25), `node_spawns` dos nós iniciais,
      `encounter_rate` por tipo. Idempotente (upsert por slug/chave).
- [ ] A7. `db push` e verificar no remoto (tabelas/colunas/enums; contagem do seed).
      [confirmar antes]

### Backend
- [ ] A8. `services/combat.js`: snapshots (player/enemy), `rollInitiative` +
      ações adicionais por Velocidade, `resolveAttack` (Rápido/Forte, acerto,
      crítico, dano, mínimo 1), `resolveReaction` (matchup: block/dodge),
      `resolveCounter` (×1.5 automático, flag `counter_attack_enabled` por classe —
      default todas true, meta futura só Vagante), `enemyTurn` (IA attacker_simple),
      `advanceTurn`, `checkEnd`.
- [ ] A9. Modelo de reação pendente (`combat_sessions.pending`): pausa antes de cada
      ataque inimigo, "uma reação por ciclo", reset na vez do jogador.
- [ ] A10. `routes/combat.js`: `POST /combat/hunt` (100%), `GET /combat/:id`,
      `POST /combat/:id/action`, `POST /combat/:id/react`, `POST /combat/:id/flee`.
      Autenticação + propriedade do personagem.
- [ ] A11. Registrar cada ação/reação/contra-ataque em `combat_turns`.

### Frontend
- [ ] A12. `combatService` em `services/api.js` (hunt/get/action/react/flee).
- [ ] A13. `pages/Combat.jsx` + `Combat.css`: ordem de turno, HP, painel de ação
      (Rápido/Forte/Habilidade/Fugir/Passar), overlay de reação
      (Bloquear/Desviar/Deixar passar) sem revelar o tipo, log, vitória/derrota/fuga.
- [ ] A14. Botão **Caçar** em `pages/Game.jsx` → inicia sessão → navega para Combat.

## Sub-parte B — Habilidades de classe nível 1–3
- [ ] B1. Migration + seed `abilities_catalog` (habilidades nv1–3 das 5 classes:
      class_key, tipo, nível, requisito de perícia, cooldown base, is_ultimate,
      efeito). RLS SELECT público + grants.
- [ ] B2. `services/abilities.js`: catálogo, `effectiveCooldown` (MP_AGI×2%, teto
      40%; ultimate 20%), aplicação de passivas nv1 no snapshot e gatilhos.
- [ ] B3. Integrar `action='ability'` no motor: valida nível/perícia/cooldown,
      resolve efeito, seta cooldown no participante. Suporte-a-aliado inerte em 1x1.
- [ ] B4. Frontend: lista de habilidades com cooldown/requisito no painel de ação.

## Sub-parte C — Progressão de Nível/XP  [FEITO]
- [x] C1. `services/progression.js`: `xpToNext(N)=round(100×N^1.7)`, `awardXp`
      (loop de level-up, teto nível 10), créditos (+3 atributo, +1 combate,
      +(1+MG_INT) campo), novo `xp_to_next`.
      NOTA: derivados (HP) NÃO são recalculados no level-up — os +3 pontos de
      atributo são livres, então HP/RES só muda quando o jogador distribui os
      pontos na tela de Personagem/Perícias. Recálculo fica atrelado à distribuição.
- [x] C2. Vitória (`allies_won`) → `grantVictoryRewards` soma `xp_reward` dos
      inimigos derrotados e chama `awardXp`; grava characters + character_attributes.
      Idempotente por sessão (guarda `pending._rewarded`).
- [x] C3. Frontend: tela de vitória mostra XP ganho + resumo do level-up + espólio;
      pontos aparecem nas telas de Atributos/Perícias já existentes.

## Extra (pedido do usuário) — Log rico + loop de loot  [FEITO]
- [x] X1. Log narrativo vindo do SERVIDOR: `services/combat.js` narra ataque (tipo,
      acerto/erro, crítico, dano), reação (bloqueio/desvio certo/errado), contra-
      ataque e quedas. Rotas acumulam em `session._events` e devolvem em `events`.
      Frontend exibe `events` (não deriva mais de HP) com auto-scroll.
- [x] X2. `services/loot.js`: `rollLoot` (por `loot_table` dos inimigos) + `grantLoot`
      (STUB — concessão real depende do spec de itens). Loop pronto; `loot_table`
      vazia por ora → sem drops. Recompensa exposta no payload e na tela de vitória.

## Sub-parte D — Exposição à névoa em combate
- [ ] D1. `advanceTurn`: em nó `mist`, acúmulo de Exposição por rodada (com/sem
      proteção via `mist_resistance`); penalidades por faixa aplicadas ao snapshot.
- [ ] D2. Persistir `mist_exposure` em `character_derived` ao fim do combate.
- [ ] D3. Frontend: indicador de Exposição no combate quando em névoa.

## Encontro ao mover (atrás de flag)
- [ ] E1. `routes/characters.js` `/move`: se flag `ENCOUNTERS_ON_MOVE` (default off)
      e destino tem `encounter_rate`>0 + spawns ativos, rola encontro e sinaliza
      sessão no retorno. Documentar a flag no `.env.example`.

## Verificação (somente sob pedido explícito do usuário)
- [ ] V1. Simulação de combate por classe (motor): iniciativa, dano por tipo,
      matchup de reação, contra-ataque, fim de combate.
- [ ] V2. Progressão: XP creditado, level-up correto, trava no nível 10.
- [ ] V3. Névoa: acúmulo/penalidade/persistência.
- [ ] V4. Build + lint do frontend.
- [ ] V5. e2e que sobe servidor: rodado manualmente pelo usuário (Avast).
- [ ] V6. Commit + push por sub-parte.

## Ao final do spec
- [ ] F1. Atualizar `.kiro/ESTADO_DO_PROJETO.md` (o que ficou feito, decisões,
      pendências: itens 4–10, ataques Precisão/Área desligados, party inerte, etc.).
- [ ] F2. Remover arquivos temporários de leitura de PDF em `.kiro/` quando não
      forem mais necessários.
