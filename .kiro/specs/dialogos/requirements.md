# Spec 4 — NPCs e Diálogos (motor de palavras-chave + intenção)

Status: rascunho para aprovacao (decisoes ja tomadas com o dono).
Fontes: `docs/md/volume-iv-interface-e-gameplay.md` (Parte VI — NPCs e Diálogo),
`docs/md/mundo-atual.md` (facções, tom), `docs/md/mapa-regiao-inicial.md`
(assentamentos), `docs/md/lore.md`.

## Objetivo

Dar vida aos NPCs com um sistema de diálogo em que o jogador **digita** e o NPC
responde de forma coerente, **barato** (sem IA externa, sem latência, sem custo por
mensagem), determinístico e **diversificado** (variações + personalidade + estado).

Resolve o **conflito de design** registrado: o schema tem árvore de diálogo
(`dialogue_trees/nodes/options`), mas o Volume IV pede motor de palavras-chave +
confiança. **Decisão: motor de palavras-chave + intenção.** As tabelas de árvore
NÃO são apagadas (reservadas para cenas roteirizadas futuras), mas o sistema novo
vive em tabelas próprias.

## Decisões (RESOLVIDAS com o dono)

1. **Abordagem:** motor de reconhecimento por **intenção** via palavras-chave
   (não LLM). O jogador digita; o backend detecta a intenção e devolve uma das
   variações de resposta daquele NPC.
2. **Idioma:** **PT** agora. Estrutura **i18n-ready**: dicionário de palavras-chave
   e respostas organizados por `locale`; adicionar `en` no futuro não exige
   refatorar o motor.
3. **Fallback:** intenção `DESCONHECIDO` responde algo genérico em personagem.
   **Easter egg:** intenção `OBSCENO` (palavrões) com respostas cômicas
   ("Vou lavar sua boca com sabão!").
4. **Confiança:** a estrutura de confiança (`character_npc_state`, 0–100) é
   **implementada agora**, mas os **requisitos de confiança das respostas ficam em
   0** (tudo liberado). Os mecanismos que ALTERAM a confiança (quests, facção,
   escolhas) ficam para depois — a coluna e a leitura já ficam prontas.
5. **Comércio:** a intenção `COMERCIO` só responde em **texto** por ora (loja quando
   houver economia).
6. **Conteúdo:** **2 NPCs por assentamento** — Ironfall (inclui o **Maren Vosk**
   existente), Rostok, Vila Cinzal, Posto Belograd = **8 NPCs**. Nenhum de comércio
   nem de quest (esses virão com os respectivos sistemas).

## Intenções (MVP)

| Intenção | Gatilho (exemplos de palavras-chave PT) |
|----------|------------------------------------------|
| SAUDACAO | oi, olá, bom dia, e aí, saudações |
| DESPEDIDA | tchau, adeus, até logo, falou |
| MISSAO | missão, trabalho, tarefa, preciso de ajuda, o que fazer |
| COMERCIO | comprar, vender, loja, preço, mercadoria (só texto por ora) |
| NEVOA | névoa, bruma, neblina, norte |
| KRAKOVIA | krakovia, cidade, castelo, rei, passado |
| FACCAO | legião, conclave, igreja, karamazov, fumaça, facção |
| RUMORES | notícia, rumor, novidade, o que sabe, conte |
| SOBRE_NPC | quem é você, seu nome, o que faz aqui |
| OBSCENO | (lista de palavrões PT) -> easter egg cômico |
| DESCONHECIDO | fallback quando nada casa |

## Requisitos

### R1 — Normalização de entrada (i18n-ready)
Texto do jogador normalizado: minúsculas, remoção de acentos, colapso de espaços,
e **tolerância a erros de digitação** via distância de Levenshtein ≤ 2 ao casar
palavras-chave. Configurável por `locale` (default `pt`).

### R2 — Detecção de intenção
A partir das palavras normalizadas, casar contra o dicionário de palavras-chave
(por locale) e escolher a intenção com mais evidências. `OBSCENO` tem prioridade
(easter egg). Sem casamento -> `DESCONHECIDO`.

### R3 — Catálogo de respostas por NPC
Cada NPC tem, por intenção e locale, **3–5 variações** de resposta com um
`min_confidence` (0 por ora). O motor sorteia uma variação elegível (confiança do
personagem ≥ `min_confidence`). Personalidade do NPC transparece no texto.

### R4 — Estado de confiança
`character_npc_state(character_id, npc_id, trust 0–100, flags jsonb, updated_at)`.
Lido para filtrar respostas por `min_confidence`. Criado sob demanda com um valor
inicial (por ora **100**, para tudo ficar liberado). Mecanismos de alteração 🔮.

### R5 — Rota de conversa
`POST /npcs/:npcId/talk { characterId, text, locale? }` -> valida propriedade do
personagem, detecta intenção, sorteia resposta, retorna `{ intent, reply,
npcName }`. Não altera estado do mundo (só leitura + upsert do state inicial).

### R6 — UI de conversa (digitação)
No painel de interação, ao selecionar um NPC presente no nó, abre uma conversa:
histórico (falas do jogador e do NPC) + caixa de texto para digitar. Envia ao
`/talk` e anexa a resposta. Tom minimalista, coerente com a interface.

### R7 — Conteúdo (8 NPCs)
2 por assentamento, com personalidade e respostas próprias (SAUDACAO, DESPEDIDA,
SOBRE_NPC, NEVOA, KRAKOVIA, FACCAO, RUMORES, MISSAO/COMERCIO em texto genérico
"ainda não"). Coerentes com a facção/local.

## Fora de escopo (🔮)
- Alterar confiança (quests, reputação de facção, escolhas).
- Loja/comércio real (economia).
- Quests reais e NPCs de quest.
- Locale `en` (só a estrutura fica pronta).
- Fallback via LLM para `DESCONHECIDO` (arquitetura deixa a porta aberta; não agora).
- Agenda de NPC (`npcs.schedule`) e cenas roteirizadas via `dialogue_*`.

## Compatibilidade
Tabelas `dialogue_*` permanecem intactas (reservadas). Novas tabelas não conflitam.
NPCs existentes (Maren Vosk) reaproveitados por nome/nó.
