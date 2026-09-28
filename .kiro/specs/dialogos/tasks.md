# Tarefas — NPCs e Diálogos

Uma sub-parte por vez, com verificacao e revisao. Avisar antes de db push.

## Sub-parte A — Schema + conteúdo (NPCs, respostas)
- [ ] A1. Migration `create_npc_dialogue` (tabela + RLS SELECT pública + grants).
- [ ] A2. Migration `create_character_npc_state` (tabela + RLS própria + grants).
- [ ] A3. Doc `docs/md/npcs-regiao-inicial.md`: 8 NPCs (2 por assentamento;
      Ironfall reaproveita Maren Vosk), personalidade + respostas por intenção.
- [ ] A4. `scripts/seed-npcs.js` (cria/atualiza NPCs por nó) e
      `scripts/seed-npc-dialogue.js` (popula npc_dialogue pt). Idempotentes.
- [ ] A5. Aplicar migrations (AVISAR antes do db push) e rodar seeds. Verificar.
- [ ] **Revisao do dono.**

## Sub-parte B — Motor + rota
- [ ] B1. `services/dialogueLexicon.js` (LEXICON por locale; pt completo, en vazio).
- [ ] B2. `services/dialogue.js` (normalize, levenshtein, detectIntent, pickReply).
- [ ] B3. `routes/npcs.js` (GET /npcs/:id, POST /npcs/:id/talk) + registrar no server.
- [ ] B4. Unit tests do motor (node); `node --check`.
- [ ] **Revisao do dono.**

## Sub-parte C — UI de conversa (digitação)
- [ ] C1. `npcService.talk` no api.js.
- [ ] C2. `Game.jsx`: botão Conversar por NPC + painel de conversa (histórico +
      input; Enter envia). CSS.
- [ ] C3. lint + build.
- [ ] **Revisao do dono.**

## Sub-parte D — Verificação e docs
- [ ] D1. e2e HTTP do /talk (intenções, easter egg, desconhecido). Limpar dados.
- [ ] D2. Atualizar Volume IV (conflito resolvido: motor implementado; dialogue_*
      reservado) e README/índice; ESTADO_DO_PROJETO.
- [ ] **Revisao do dono.**

## Notas
- Confiança: `trust` default 100; `min_confidence` das respostas = 0 por ora.
- Comércio/Missão: só resposta em texto ("ainda não") no MVP.
- Seeds via scripts Node (REST), não db push. Avisar antes de qualquer db push.
