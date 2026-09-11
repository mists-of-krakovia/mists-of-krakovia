# Design — Sistema de Perícias

Baseado nos requisitos em `requirements.md`. Assume as recomendações das decisões
pendentes; ajustável na aprovação.

## Modelo de dados

### Nova tabela `skills_catalog` (via migration + seed)
Fonte única das perícias existentes no jogo.

```
skills_catalog(
  slug          varchar PK,        -- ex.: 'armas_brancas_leves'
  name          varchar,           -- 'Armas Brancas Leves'
  skill_type    skill_type,        -- 'field' | 'combat'
  base_attr     varchar,           -- 'agility' | 'strength' | 'perception' | ...
  base_attr_alt varchar null,      -- 2º atributo p/ perícias híbridas (FOR/AGI)
  requires_training boolean,       -- perícias de campo com '*'
  attr_mg_req   integer null       -- requisito de MG do atributo base (ex.: 2)
)
```

Semeado no `seed.sql` com as 14 de campo e 12 de combate (valores do Volume III).

### `character_skills` (já existe — reutilizada)
`(character_id, skill_name, skill_type, level, xp)`. Convenção: `skill_name`
guarda o `slug` do catálogo. RLS de SELECT já existe; INSERT/UPDATE via backend
service_role (mesmo padrão já corrigido para as demais tabelas).

### `character_attributes` — colunas novas (migration)
```
field_skill_points  integer NOT NULL DEFAULT 0
combat_skill_points integer NOT NULL DEFAULT 0
```
Guardam pontos ainda não gastos (para progressão futura). Na criação, o que sobrar
da distribuição é gravado aqui.

## Backend

### `services/skills.js` (novo)
- `INITIAL_SKILLS_BY_CLASS`: mapa classe -> 3 slugs de combate (nível 2).
- `mgOf(value)`: reaproveita o helper já criado em `services/character.js`.
- `validateSkillAllocation({ classKey, attributes, fieldAlloc, combatAlloc })`:
  valida que (a) os totais não excedem `1 + MG_INT` (campo) e `3` (combate);
  (b) cada perícia investida atende o requisito de atributo do catálogo;
  (c) não rebaixa as iniciais da classe. Retorna as linhas a inserir e os pontos
  restantes.

### `routes/characters.js` — criação
Após inserir atributos/derivados, dentro do mesmo fluxo:
1. Monta as linhas de `character_skills`: as 3 da classe (nível 2) + incrementos
   das alocações do jogador.
2. Insere em `character_skills`.
3. Grava `field_skill_points`/`combat_skill_points` restantes em `character_attributes`.
Tudo com o cliente service_role (RLS ignorada), como as demais escritas.

### Novo endpoint `GET /skills/catalog`
Retorna o catálogo (para o frontend renderizar a etapa de criação e a página
in-game). Autenticado (`authenticateToken`), leitura simples.

### Novo endpoint `POST /characters/:characterId/skills/allocate`
Aplica a distribuição de pontos na página in-game. Corpo:
`{ field: { <slug>: deltaPts }, combat: { <slug>: deltaPts } }`.
Validações no backend (service_role):
- personagem pertence à conta (mesmo padrão de propriedade já usado);
- soma dos deltas de cada tipo ≤ pontos disponíveis (`field_skill_points`/
  `combat_skill_points`);
- cada perícia investida atende o requisito de atributo do catálogo;
- nível resultante ≤ 10.
Efeito: incrementa `level` em `character_skills` (upsert por `(character_id,
skill_name)`) e debita os pontos em `character_attributes`. Idealmente atômico;
como não há transação multi-tabela trivial via supabase-js, validar tudo antes e
aplicar em sequência, retornando o estado final para o cliente reconciliar.

### `POST /characters` — corpo estendido
```
{ name, characterClass, attributes,
  skills: { field: { <slug>: pts }, combat: { <slug>: pts } } }
```
Retrocompatível: se `skills` ausente, cria só as iniciais da classe e guarda os
pontos como disponíveis (jogador distribui depois — comportamento seguro).

## Frontend

### `services/api.js`
- `skillService.getCatalog()` -> `GET /skills/catalog`.
- `characterService.create(...)` passa a enviar também `skills`.

### `pages/Characters.jsx` — nova etapa (entre Atributos e Confirmação)
- Carrega o catálogo via `skillService.getCatalog()`.
- Duas abas (Campo/Combate) com +/- por perícia, contador de pontos por grupo.
- Perícias iniciais da classe: exibidas como nível 2 fixo.
- Requisito de atributo não atendido: item em cinza, desabilitado, com o requisito
  visível. O cálculo usa os atributos já distribuídos na etapa anterior.
- Passa a ser fluxo de 4 etapas: Classe -> Nome+Atributos -> Perícias -> Confirmação.
  (O doc pede 5; nome e atributos seguem juntos por ora — documentado como desvio
  menor consciente.)

### `pages/Game.jsx` — página "Perícias" (interativa)
Substitui o placeholder. Agrupa por tipo (Campo/Combate), mostra nome (via
catálogo), nível e atributo base. Exibe pontos disponíveis por tipo e permite
investir com +/- nas perícias elegíveis (requisito de atributo atendido, nível < 10).
Ao confirmar, chama `POST /characters/:id/skills/allocate` e recarrega o estado
(reusa o fluxo de `enter`/reload). Tolerante a lista vazia e a zero pontos.
`/enter` deve passar a incluir `character_skills` e os pontos disponíveis no payload
(hoje `enter` já seleciona `character_skills (*)`; adicionar os campos de pontos).

## Migrations (ordem)
1. `create_skills_catalog` — tabela + RLS de SELECT pública + grants.
2. `add_skill_points_to_attributes` — colunas em `character_attributes`.
3. `seed` — popular `skills_catalog` (idempotente via upsert por slug).

## Verificação
- Teste e2e: criar personagem de cada classe, conferir as 3 perícias nível 2,
  distribuir pontos válidos e inválidos (requisito não atendido deve ser rejeitado),
  ler de volta e conferir pontos restantes.
- Build + lint do frontend.
- `GET /skills/catalog` retorna 26 perícias.
