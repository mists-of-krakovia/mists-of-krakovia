# Spec 3 — Sistema de Inventário / Itens

Status: rascunho para aprovacao (decisoes de design ja resolvidas com o dono).
Fontes de verdade (Markdown vivo; PDFs sao planejamento inicial):
`docs/md/volume-iii-personagem-e-combate.md` (atributos derivados + bonus de
equipamento; Mutacao), `docs/md/volume-iv-interface-e-gameplay.md` (inventario,
acoes, economia), `docs/md/volume-v-classes.md` (custo de item das habilidades).

## Objetivo

Implementar o sistema de inventario e itens, que amarra as pontas soltas do
combate: destrava o loot real (hoje `grantLoot` e stub), liga o custo de item das
habilidades (Granada/Veneno/Pocao), e introduz progressao por equipamento
(equipamento afeta os derivados de combate). Hoje o inventario e so leitura no
frontend; as tabelas `items` e `character_inventory` ja existem no banco.

## Terminologia

- **Item**: linha do catalogo `items` (arma, armadura, consumivel, recurso, etc.).
- **Inventario**: linhas de `character_inventory` (o item que um personagem possui).
- **Equipamento**: item com `is_equippable = true`, ocupa um slot; concede bonus.
- **Consumivel**: item `item_type = consumable`, usado (fora ou dentro de combate),
  reduz `quantity`.
- **Mutacao**: stat de personagem (0-100) que mede o quanto a Nevoa ja alterou o
  corpo/mente. Sobe com itens Corrompidos e (no futuro) com exposicao em combate.
  **Nao e implementada neste spec** — so registrada no design como sistema 🔮.
- **Item Corrompido**: eixo transversal (qualquer slot) — item muito mais forte que
  o normal, com penalidades pesadas e que aumenta a Mutacao. **Adiado (🔮)**; so
  documentado, nao implementado no MVP (mecanica de camadas avancadas do jogo).

## Decisoes de design (RESOLVIDAS com o dono)

1. **Modelo de item.** `items.stats` (jsonb) = bonus diretos a derivados
   (`{ "attack_melee": 4, "accuracy": 2 }`). `items.requirements` (jsonb) =
   `{ "str_mg": 4 }` e/ou `{ "skill": "armaduras_pesadas", "level": 1 }`.
   Equipamento normal **so soma** aos derivados, nunca reduz. (Reducoes so existem
   em itens Corrompidos — adiados.)
2. **Raridade influencia a qualidade dos stats.** Enum expandido para 5:
   `common, uncommon, rare, epic, legendary`. Obtencao:
   - common / uncommon / rare: drop e/ou fabricacao.
   - **epic**: drop de boss **e** fabricacao. Item **nomeado**.
   - **legendary**: **so** fabricacao. Item **nomeado**.
   - **MVP usa apenas `common` e `uncommon`.** As demais ficam registradas.
3. **Slots de equipamento (9):** `head, chest, hands, legs, main_hand, off_hand,
   accessory_1, accessory_2`. Regras de arma de duas maos / duas armas por classe
   ficam adiadas (provavel pericia futura); no MVP um item ocupa um unico slot.
4. **Loot concede itens:** stackaveis (consumivel/recurso) empilham `quantity`;
   equipaveis criam linha propria. Sobrepeso **penaliza pesado** (ver R7).
5. **Origem de cada bonus explicita** para o sistema e para o jogador. A camada de
   equipamento e calculada de forma que `character_derived` continue sendo
   base+nivel; equipamento entra como camada separada e visivel (ver design).
6. **Durabilidade adiada.** Campo `durability` existe mas nao e consumido.
7. **Habilidades Granada/Veneno/Pocao exigem e consomem item.** Sem o item, a
   habilidade fica indisponivel (desabilitada, com motivo).
8. **Valor base** preparado: novo campo de valor no item (economia 🔮, sem
   compra/venda agora).

## Escopo (o que este spec implementa)

### R1 — Catalogo de itens versionado + seed
Popular `items` com um conjunto inicial (MVP: so `common`/`uncommon`) cobrindo:
armas por perfil (branca leve/pesada, fogo leve), armaduras por slot
(cabeca/torax/maos/pernas), acessorios, consumiveis (pocao de cura, frasco de
veneno, granada quimica, granada de gas), recursos de loot. Convencao de
`stats`/`requirements`/valor base definida no design. Aplicado via migration +
script de seed Node (fluxo padrao da maquina — `db push` nao roda seed).

### R2 — Expansao do enum de raridade + regras de obtencao
`item_rarity` passa a `common, uncommon, rare, epic, legendary`. Regras de
obtencao registradas (epic = boss+fabricacao, legendary = so fabricacao; ambos
nomeados). Sem quebrar dados existentes.

### R3 — Concessao de loot real
`enemy_catalog.loot_table` populada para os inimigos iniciais. `grantLoot` deixa de
ser stub: resolve `item_slug -> item_id`, faz upsert em `character_inventory`
(empilha stackaveis, cria linha para equipaveis). O payload de recompensa do
combate (ja existente) passa a mostrar os itens concedidos.

### R4 — Acoes de inventario (fora de combate)
Rotas + UI para: **Equipar**, **Desequipar**, **Usar** (consumivel), **Descartar**.
Regras: item deve pertencer ao personagem; equipar respeita slot e requisitos
(MG de atributo e/ou pericia); um item por slot (o anterior volta para a mochila);
usar consumivel aplica efeito e decrementa `quantity` (remove a 0); descartar
remove do inventario.

### R5 — Equipamento afeta os derivados
Os bonus de `items.stats` dos itens equipados entram nos derivados do personagem
(PV, Acerto, Ataque C.C./Distancia, Defesa, Velocidade, Evasao, etc., conforme
Volume III que ja preve "+ bonus de equipamento"). Vale tanto para exibicao quanto
para combate (`buildPlayerParticipant`). A origem do bonus (base / nivel /
equipamento) e distinguivel.

### R6 — Consumiveis em combate + custo de item das habilidades
- Nova acao de combate **Usar Item** (consumivel do inventario; ex.: pocao cura).
- Habilidades que consomem item passam a exigir e consumir 1 unidade:
  - Granada Quimica -> `granada_quimica`
  - Ataque Envenenado -> `frasco_veneno`
  - Pocao em Area -> `pocao_cura`
  - Gas Paralisante -> `granada_gas`
  Sem o item no inventario, a habilidade fica indisponivel (desabilitada + motivo).
  O consumo persiste no `character_inventory` ao fim/durante o combate.

### R7 — Peso e sobrepeso
Peso total do inventario vs `carry_capacity` (`MG_FOR x 10`, ja calculado). Acima
da capacidade, **penalidade pesada** (definir no design: forte reducao de
Velocidade/Evasao e, possivelmente, bloqueio de acoes). Exibido claramente na UI.

### R8 — Valor base do item
Campo de valor base no item (para economia futura). Sem loja/compra/venda agora.

## Fora de escopo (🔮 registrado, nao implementado)
- **Itens Corrompidos** e a stat de **Mutacao** (camadas avancadas; so documentado).
- **Fabricacao/producao** (destrava epic/legendary; Volume IV Parte IV).
- **Economia**: moeda, loja, comercio entre jogadores, mercado regional.
- **Durabilidade/desgaste** (campo existe, sem consumo).
- Raridades **rare/epic/legendary** como conteudo jogavel (so o enum e as regras).
- Regras de arma de duas maos / duas armas por classe.

## Compatibilidade
Personagens existentes: inventario vazio nao quebra a UI (ja tolerado). A expansao
do enum e aditiva. Novos campos de item tem default seguro.
