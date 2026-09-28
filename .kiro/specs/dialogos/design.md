# Design — NPCs e Diálogos

Baseado em `requirements.md`. Decisões aprovadas. Arquitetura fixada.

## 1. Modelo de dados

### 1.1 `npc_dialogue` (nova) — respostas por NPC × intenção × locale
```
npc_dialogue(
  id            uuid PK default gen_random_uuid(),
  npc_id        uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  locale        varchar(5) NOT NULL DEFAULT 'pt',
  intent        varchar(20) NOT NULL,       -- SAUDACAO, NEVOA, ... , DESCONHECIDO
  variants      jsonb NOT NULL DEFAULT '[]',-- ["resposta 1","resposta 2", ...]
  min_confidence integer NOT NULL DEFAULT 0,-- confiança mínima do personagem (0 por ora)
  sort_order    integer NOT NULL DEFAULT 0
)
UNIQUE (npc_id, locale, intent, sort_order)  -- permite +de1 bloco por intencao se preciso
```
Leitura pública (conteúdo do mundo, mesmo padrão de enemy_catalog/items).

### 1.2 `character_npc_state` (nova) — confiança por personagem × NPC
```
character_npc_state(
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  npc_id       uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  trust        integer NOT NULL DEFAULT 100,  -- 0..100; 100 por ora (tudo liberado)
  flags        jsonb NOT NULL DEFAULT '{}',   -- ganchos futuros (ja falou, quests...)
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, npc_id)
)
```
RLS: SELECT/UPSERT próprios (mesmo padrão de character_inventory). O backend usa
service_role, então na prática o gate é a checagem de propriedade na rota.

### 1.3 Dicionário de intenções — em CÓDIGO (não no banco)
As palavras-chave por intenção e locale vivem em `services/dialogueLexicon.js`
(dado versionado, fácil de estender por locale). Não vão para o banco porque são
lógica de parsing compartilhada por todos os NPCs, não conteúdo por-NPC.
```
LEXICON = {
  pt: {
    SAUDACAO: ['oi','ola','bom dia','boa tarde','boa noite','e ai','saudacoes','opa'],
    DESPEDIDA: ['tchau','adeus','ate logo','falou','ate mais'],
    MISSAO: ['missao','trabalho','tarefa','ajuda','o que fazer','servico'],
    COMERCIO: ['comprar','vender','loja','preco','mercadoria','negocio','troca'],
    NEVOA: ['nevoa','bruma','neblina','norte','fumaca fria'],
    KRAKOVIA: ['krakovia','cidade','castelo','rei','passado','ruinas'],
    FACCAO: ['legiao','conclave','igreja','veu','karamazov','fumaca','faccao','herdeiros'],
    RUMORES: ['noticia','rumor','novidade','o que sabe','conte','fofoca'],
    SOBRE_NPC: ['quem e voce','seu nome','o que faz','quem es'],
    OBSCENO: [ (lista de palavroes pt) ],
  },
  en: { ... }   // 🔮 vazio/estrutura por ora
}
```

## 2. Motor (`services/dialogue.js`, funções puras)

- `normalize(text, locale)` -> string: minúsculas, remove acentos (NFD + strip),
  colapsa espaços, remove pontuação.
- `levenshtein(a, b)` -> número (helper).
- `matchesKeyword(tokenizedInput, keyword)` -> bool: casa palavra-chave (uni/bi-grama)
  com tolerância Levenshtein ≤ 2 por token (só para tokens de comprimento ≥ 4, para
  não confundir palavras curtas).
- `detectIntent(text, locale)` -> intent: conta evidências por intenção; `OBSCENO`
  tem prioridade absoluta; empate resolve por ordem de prioridade
  (OBSCENO > SOBRE_NPC > MISSAO > COMERCIO > FACCAO > KRAKOVIA > NEVOA > RUMORES >
  SAUDACAO > DESPEDIDA); zero evidência -> `DESCONHECIDO`.
- `pickReply(dialogueRows, intent, trust)` -> string: filtra as linhas da intenção
  com `min_confidence <= trust`, junta as `variants`, sorteia uma. Se a intenção não
  tem resposta cadastrada, cai para `DESCONHECIDO` do próprio NPC; se nem isso, usa
  um fallback global.

## 3. Backend

### 3.1 `routes/npcs.js` (nova)
- `GET /npcs/:npcId` — dados públicos do NPC (nome, descrição, nó).
- `POST /npcs/:npcId/talk { characterId, text, locale? }`:
  1. valida que o personagem pertence ao usuário e que o NPC existe;
  2. `state = upsert character_npc_state` (cria com trust=100 se não existe);
  3. `intent = dialogue.detectIntent(text, locale||'pt')`;
  4. carrega `npc_dialogue` do NPC no locale; `reply = dialogue.pickReply(...)`;
  5. retorna `{ intent, reply, npcName }`.
- Registrado em `server.js` sob `/npcs`. Autenticado.

> `/enter` já retorna os NPCs do nó (id, name, description, is_quest_giver). O
> frontend usa isso para listar; a conversa é via `/npcs/:id/talk`.

## 4. Frontend

### 4.1 `services/api.js`
`npcService.talk(npcId, characterId, text, locale?)`.

### 4.2 `pages/Game.jsx` — painel de interação (NPCs presentes)
Hoje há a seção "NPCs presentes" (lista). Cada NPC ganha um botão "Conversar" que
abre um **painel de conversa**:
- histórico (linhas do jogador à direita, do NPC à esquerda);
- input de texto + botão Enviar (Enter envia);
- ao enviar: chama `npcService.talk`, anexa a fala do jogador e a resposta do NPC.
Estado local do componente (não persiste histórico no MVP). Minimalista.

## 5. Migrations (ordem)
1. `create_npc_dialogue` — tabela + RLS pública de SELECT + grants.
2. `create_character_npc_state` — tabela + RLS própria + grants.

## 6. Seed (scripts Node REST, idempotentes)
- `backend/scripts/seed-npcs.js` — cria/atualiza os 8 NPCs (por nó, via
  description_key do assentamento). Reaproveita Maren Vosk por nome+nó.
- `backend/scripts/seed-npc-dialogue.js` — popula `npc_dialogue` (pt) por NPC:
  SAUDACAO, DESPEDIDA, SOBRE_NPC, NEVOA, KRAKOVIA, FACCAO, RUMORES, MISSAO,
  COMERCIO, OBSCENO, DESCONHECIDO. 3–5 variações cada, personalidade por NPC.
- Fonte de verdade do conteúdo dos NPCs: um doc `docs/md/npcs-regiao-inicial.md`.

## 7. Verificação
- Unit (sem rede): normalize (acentos/caixa), levenshtein, detectIntent (cada
  intenção + typo + OBSCENO prioritário + DESCONHECIDO), pickReply (filtra por
  confiança, sorteia).
- e2e HTTP: talk com várias frases -> intenção e resposta coerentes; easter egg;
  DESCONHECIDO. Limpar dados de teste.
- lint + build frontend.

## 8. Extensibilidade (registrado)
- **Locale `en`:** adicionar `LEXICON.en` + linhas `npc_dialogue` com `locale='en'`.
  O motor já recebe `locale`.
- **Confiança dinâmica:** quando existir, alterar `character_npc_state.trust`; as
  respostas com `min_confidence>0` passam a gatear naturalmente (o motor já filtra).
- **Fallback LLM (🔮):** só no caso `DESCONHECIDO`, como camada opcional, com prompt
  travado (personagem, sem dar quests/fatos). Não implementado agora.
