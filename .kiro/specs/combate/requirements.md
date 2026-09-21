# Spec 2 — Combate por Turnos + Progressão de Nível/XP

Status: rascunho para aprovação
Fontes de verdade:
- `docs/mists_of_krakovia_gameplay_v1.pdf` (Volume III — Atributos, Derivados,
  Perícias de Combate, Sistema de Combate, Névoa em Combate).
- `docs/mists_of_krakovia_classes_v2.pdf` (Volume V — Classes, habilidades,
  cooldown por Velocidade).

## Objetivo

Introduzir o sistema de combate por turnos e a progressão de nível/XP, que são
tratados juntos porque combate é a principal fonte de XP e o level-up credita os
pontos (atributo, perícia) que alimentam as telas já prontas (Perícias) e o
próprio combate.

O banco é modelado desde já para **combate multi-combatente (party/multi-alvo)**,
mas a implementação inicial roda **1x1 / single-target** em cima dessa estrutura.
Mecânicas de grupo do Volume V (suporte a aliados, buffs de grupo, dano em área)
ficam modeladas/inertes até existir party e sistema de equipamento.

## Terminologia (herdada do Spec 1)

- **Perícia** (`character_skills`, nível 0–10): treinamento em armas/armaduras/
  técnicas. Já implementada no Spec 1. É pré-requisito de Habilidades.
- **Habilidade** (Volume V): poder de classe (ativo/passivo/ultimate), desbloqueado
  por **nível do personagem**, com **requisito de perícia** e **cooldown**. É o que
  este spec modela (níveis 1–3 nesta entrega).
- **Ataque** (tipo de ação): Rápido / Forte (ativos neste spec); Precisão / Área
  (modelados, desligados).
- **Reação**: Bloquear / Desviar. **Contra-Ataque** não é reação de menu — é
  consequência automática de uma reação correta.

## Modelo de combate (decisões fechadas)

### Estrutura
- Combate multi-combatente no banco; execução inicial 1x1/single-target.
- Participantes têm lado (`ally` / `enemy`). O personagem-jogador é um participante
  do lado `ally`; o inimigo vem do `enemy_catalog`.
- Iniciativa e ordem de turno por **Velocidade** (maior→menor; empate por RNG).
  Ações adicionais por Velocidade conforme Volume III (>=1.5× de outro → +1 ação;
  >=2× → +2; etc.).
- Os atributos derivados de cada combatente são **congelados em snapshot** no início
  do combate (buffs/debuffs de combate não escrevem em `character_derived`).

### Ações de ataque
- **Ataque Rápido**: −15% de Ataque, +10% de Acerto, sem penalidade de Velocidade.
- **Ataque Forte**: +25% de Ataque, −3 de Velocidade na próxima rodada.
- **Ataque de Precisão** (armas de longo alcance — arcos, armas de fogo):
  MODELADO, **desligado** neste spec.
- **Ataque em Área** (classe + equipamento): MODELADO, **desligado** neste spec.
- Não existe mais "Ataque Padrão".
- Contra inimigos que não reagem (iniciais), a escolha Rápido vs. Forte vale pela
  diferença de dano/tempo. O matchup tipo-vs-reação importa na **defesa** (reagir
  aos ataques do inimigo) e no futuro, quando inimigos reagirem.

### Reações (matchup às cegas)
- Menu do jogador: **Bloquear**, **Desviar**, **Deixar passar**.
- O jogador reage **sem saber** o tipo do ataque inimigo; descobre o resultado
  só após a resolução. (Abre porta futura para inimigos que "leem" o jogador.)
- **Matchup correto → 100% de redução (dano zerado):**
  - **Desviar** é correto contra **Ataque Rápido**.
  - **Bloquear** é correto contra **Ataque Forte**.
- **Bloquear errado** (contra um Rápido): ainda **mitiga parte do dano** (fórmula de
  Bloqueio do Volume III: perícia Escudos e Bloqueio ×2 + Defesa de armadura). É a
  reação "segura".
- **Desviar errado** (contra um Forte): falha — dano total passa (tudo-ou-nada).
- **Uma reação por ciclo de ações inimigas**: antes de cada ataque inimigo dirigido
  ao jogador, o sistema oferece a reação. Ao reagir uma vez (Bloquear/Desviar), a
  reação está **gasta** até a próxima ação do jogador; os demais ataques daquele
  ciclo resolvem sem reação. (Classe/equipamento poderá dar reações extras no
  futuro.)

### Contra-Ataque
- **Automático**: dispara na hora quando a reação foi **correta** (matchup certo),
  contra o inimigo reagido.
- Dano = ataque normal **×1.5** (+50%).
- Controlado por flag por classe (`counter_attack_enabled`). **Default atual: todas
  as classes `true`** (fase de teste). **Meta de design: exclusivo do Vagante das
  Névoas** — as demais serão desabilitadas após os testes. Sem o recurso, a reação
  correta apenas zera/mitiga o dano, sem devolver.

### Inimigos e IA
- Inimigos atacam com tipos (Rápido/Forte) — alimenta o matchup de defesa.
- **Inimigos iniciais: IA "só atacar"**, não reagem, não usam habilidades.
  Perfis de IA mais ricos (reação, habilidades) virão depois, caso a caso.

### A Névoa em combate (sub-parte d)
- Exposição acumulada por rodada dentro da névoa (Volume III): sem proteção, +1
  ponto/rodada; com proteção, +1 a cada `R.Névoa / 10` rodadas.
- Penalidades progressivas por faixa de Exposição (1–5, 6–10, 11–15, 16+).
- Redução fora da névoa: 1 ponto/minuto de ar limpo (fora de combate).

## Progressão de Nível/XP

- **Nível máximo = 10** nesta entrega (evoluções de classe virão depois).
- **Curva de XP para subir de N→N+1**: `round(100 × N^1.7)`. Acumulado até o 10 ≈
  16.011 XP. (Cresce quase quadraticamente para dar impacto real por nível.)
- **Fonte de XP = por inimigo derrotado.** Cada inimigo tem `xp_reward` no
  `enemy_catalog`; ao vencer, soma-se o `xp_reward` dos derrotados e credita-se ao
  personagem. Inimigos mais fortes dão mais XP (e melhor loot, futuro).
  - Âncora inicial: monstros do primeiro mapa dão **15–25 XP**.
- **Level-up credita** (Volume III):
  - **+3 pontos de atributo** por nível (livres, sem restrição de distribuição).
  - **+1 ponto de perícia de combate** por nível.
  - **+`1 + MG_INT` pontos de perícia de campo** por nível (mesma fórmula da
    criação; MG_INT = letra do Intelecto, 1..7).
  - Esses pontos caem nas colunas já existentes (`points_available`,
    `field_skill_points`, `combat_skill_points`) e são gastos nas telas já prontas
    (Atributos futuros / Perícias in-game do Spec 1).
- Level-up também recalcula os derivados de HP/etc. e recompõe `xp_to_next`
  (coluna já existe em `characters`).

## Gatilho de encontro

- **Caçar** (`hunt_manual`): endpoint dedicado. **100% de encontro** por enquanto
  (acelera testes; calibra depois). Inicia uma `combat_session` com inimigo(s)
  sorteado(s) da `node_spawns` do nó atual.
- **Encontro ao mover**: taxa base por `node_type`, guardada em
  `world_nodes.encounter_rate`:
  - `passage` (rotas/estradas): ~10%
  - `field` (zona inicial/campos): ~25%
  - `mist`: mais alto (calibra)
  - `settlement`: 0%; `secret`: caso a caso
  - **Nasce atrás de uma flag / desligável** para não atrapalhar a exploração já
    funcional até o combate estar validado pela ação de caçar.
- **Buscar** (`general_search`): FORA deste spec (vai no spec de Exploração/Coleta).

## Requisitos

### R1 — Catálogo de inimigos versionado (`enemy_catalog`)
Fonte única dos inimigos (atributos, HP, `xp_reward`, IA, habilidades, flags de
raridade/loot reservadas), versionada (migration + seed). Base do futuro bestiário.

### R2 — Banco de combate multi-combatente
`combat_sessions`/`combat_turns` remodeladas para N combatentes via
`combat_participants` (lado, referência a personagem OU inimigo, HP, snapshot de
stats, iniciativa, ações extras). Enums de combate generalizados.

### R3 — Tabela de spawn por nó (`node_spawns`)
Relação nó↔inimigo com a mecânica de spawn na ligação (tipo, peso, quantidade,
condições). `world_nodes.encounter_rate` guarda a taxa base por nó.

### R4 — Motor de turnos (sub-parte a)
Iniciativa por Velocidade, ações adicionais, resolução de ataque (Rápido/Forte),
acerto vs. evasão, crítico, dano, aplicação de efeitos, reações (Bloquear/Desviar
às cegas com matchup), contra-ataque automático, condições de vitória/derrota/fuga.

### R5 — Ação de Caçar
Endpoint que inicia combate a partir do nó atual (100% por ora). Retorna o estado
inicial da sessão para o frontend renderizar.

### R6 — Habilidades de classe nível 1–3 (sub-parte b)
Modelar as habilidades desbloqueadas até o nível 3 de cada classe (ativas com
cooldown, passivas), com redução de cooldown por Velocidade (`MP_AGI × 2%`, teto
40%; ultimates teto 20%). Ativar as que fazem sentido em 1x1/single-target;
suporte-a-aliado fica inerte até haver party.

### R7 — Progressão de Nível/XP (sub-parte c)
Creditar XP por inimigo ao vencer; aplicar curva `100 × N^1.7`; level-up creditando
pontos de atributo/perícia e recalculando derivados; nível máximo 10.

### R8 — Exposição à Névoa em combate (sub-parte d)
Acúmulo de Exposição por rodada em nós de névoa, penalidades progressivas, e
redução fora da névoa. Usa `character_derived.mist_exposure` (já existe).

### R9 — Frontend de combate
Tela de combate: ordem de turno, HP dos combatentes, escolha de ação
(Rápido/Forte/Habilidade/Fugir/Passar), prompt de reação (Bloquear/Desviar/Deixar
passar) antes das ações inimigas, feedback de resultado, tela de vitória com XP e
level-up. Botão **Caçar** no nó.

### R10 — Compatibilidade
Personagens e nós existentes não quebram: nó sem `node_spawns` simplesmente não
gera encontro; combate nunca rodou (tabelas vazias), então a remodelagem das
tabelas de combate pode recriá-las sem migração de dados.

## Fora de escopo (deste spec)
- Ação **Buscar**/coleta de recursos (spec de Exploração futuro).
- **Ataque de Precisão** e **Ataque em Área** ativos (dependem do sistema de
  equipamento com propriedades — spec de itens futuro).
- **Habilidades de classe níveis 4–10** e **ultimates**.
- **Party multiplayer real** (co-op): a estrutura é preparada, a jogabilidade de
  grupo não é implementada agora.
- **Loot / drops** de combate (campo `loot_table` reservado, inerte).
- **IA de inimigo avançada** (reação, habilidades, comportamento por tipo).
- **Bestiário in-game** (a tabela alimenta; a tela vem depois).
- Regeneração de estamina, ações de inventário em combate além do essencial.

## Decisões (resolvidas com o usuário)
1. Banco multi-combatente desde já; execução inicial 1x1. [aprovado]
2. `enemy_catalog` versionada + `combat_participants` (snapshot de stats em jsonb) +
   `node_spawns` (mecânica de spawn na ligação). [aprovado]
3. Recriar as três tabelas de combate limpas (estão vazias) e generalizar enums.
   [aprovado — "faça como achar melhor"]
4. Efeitos de status: `character_status_effects` fica só para o personagem; efeitos
   temporários de inimigo vivem no jsonb do participante. [aprovado]
5. Tipos de ataque: só Rápido e Forte ativos; Precisão/Área desligados. [aprovado]
6. Reações: Bloquear/Desviar às cegas; matchup correto = 100% de redução; bloqueio
   errado ainda mitiga; desvio errado falha. [aprovado]
7. Contra-ataque automático, ×1.5, só após reação correta, só classes com o recurso.
   [aprovado]
8. Uma reação por ciclo de ações inimigas. [aprovado]
9. Curva de XP `100 × N^1.7`; XP por inimigo (`xp_reward`); iniciais 15–25; nível
   máximo 10. [aprovado]
10. Caçar 100% por ora; encontro ao mover por `node_type` atrás de flag. [aprovado]
11. Habilidades de classe em tabela versionada `abilities_catalog`. [aprovado]
12. Habilidades que consomem item: custo adiado; sempre usáveis por ora (fluxo
    básico primeiro). [aprovado]
13. Fórmula de acerto: `clamp(0.5 + (acerto − evasão)×0.03, 0.05, 0.95)`, +0.10 no
    Rápido. [aprovado]
14. Contra-ataque: flag por classe, todas `true` na fase de teste, meta futura só
    Vagante. [aprovado]
15. Ações adicionais por Velocidade mantidas ativas mesmo em 1x1. [aprovado]
