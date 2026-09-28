# Mapa — Região Inicial (Ironfall e arredores)

> **Documento de conteúdo, pronto para virar seed.** Descreve a topologia completa
> da primeira região: nós, ligações (direções coerentes), tipos, zonas seguras,
> passagens secretas e a distribuição de monstros/bosses (`node_spawns`).
>
> Fontes: `docs/md/mundo-atual.md` (Zona Livre, borda da névoa ao norte),
> `docs/md/bestiario-zona-inicial.md` (36 criaturas), schema de `world_nodes` /
> `node_connections` / `node_spawns`.

---

## 1. Composição pedida × entregue

| Pedido | Entregue |
|--------|----------|
| 1 cidade grande | **Ironfall — Distrito Central** (já existe; hub inicial, safe) |
| 3 assentamentos | **Rostok** (leste), **Vila Cinzal** (oeste), **Posto Belograd** (norte, na **borda da névoa**, mais distante) |
| 12 nós de exploração | 12 nós `field`/`passage` (2 já existiam: Portão da Encosta, Floresta das Cinzas) |
| 3 com passagem secreta | 3 nós de exploração escondem uma passagem cada, levando a 3 nós `secret` (2 já existiam: Torre Queimada, Gruta dos Sinos; +1 nova) |

> **Decisão adotada:** Ironfall é a "cidade grande" (maior hub, ponto de nascimento).
> Se você preferir uma cidade grande **separada** de Ironfall, dá para renomear/
> promover um assentamento — me avise. Tudo aqui é `region = ironfall_region`.

> **A borda da névoa:** **Posto Belograd** fica ao norte, o ponto mais distante e
> perigoso. É o assentamento-limiar: dele se vê a névoa de perto, e será a **saída
> para a próxima zona (Primeira Camada)** — bloqueada por enquanto (o Posto de
> Contenção da Legião ainda não abre). Lembrete de borda embutido na descrição.

---

## 2. Topologia (grafo coerente)

Orientação geográfica a partir de Ironfall (centro-sul). Dificuldade **cresce para
o norte** (rumo à borda). Nenhuma ligação "cruza" direções incoerentes: cada
caminho segue um eixo (N/S/L/O) plausível. Todas as ligações são **bidirecionais**
(dois registros em `node_connections`).

```
                                 [ Posto Belograd ]  (assentamento, BORDA da névoa, N extremo)
                                        |  N/S
                                 ( Campo de Cinzas Alto )  nv 8-9
                                        |
                                 ( Trilha da Contenção )  nv 7-8  --secreto--> [Fenda do Reator]*
                                        |
   [ Vila Cinzal ]        ( Charco Pálido ) nv 6-7        ( Pedreira Morta ) nv 6
   (assentamento O)  --L/O--  |                                  |
        |  L/O                | N/S                              | N/S
   ( Bosque Retorcido ) nv 5  |                          ( Ferro-Velho ) nv 5  --secreto--> [Torre Queimada]*
        |                     |                                  |
   ( Campos de Cinza )  ------+------ [ IRONFALL ] ------+------  ( Estrada do Pedágio ) nv 3
     (Floresta das Cinzas)          (cidade grande, S)   |              |  L/O
     nv 2-3  --secreto--> [Gruta dos Sinos]*             |              |
        |                                                | L/O          |
   ( Portão da Encosta )  nv 1 (tutorial)                |         [ Rostok ]
        |  (sul, saída sul de Ironfall)          ( Poço dos Ratos ) nv 4   (assentamento L)
                                                         |
                                                  ( Subúrbio Afogado ) nv 4-5
```

> O diagrama é conceitual (o jogo não tem coordenadas x/y; `direction_label` guia o
> jogador). O que importa é a **coerência das ligações**: sul = fácil/tutorial;
> norte = borda/difícil; leste = Rostok; oeste = Vila Cinzal.

---

## 3. Nós (todos os campos de `world_nodes`)

Legenda: **tipo** · **safe** · **enc** = encounter_rate · **secret**.
`description_key` é o identificador estável (usado pelo seed).

### Assentamentos (safe zones, enc 0)

| description_key | Nome | Tipo | Eixo | Observação |
|-----------------|------|:----:|:----:|------------|
| `ironfall_central` 🔒 | Ironfall — Distrito Central | settlement | centro | **cidade grande**, nascimento, já existe |
| `rostok_settlement` | Rostok | settlement | leste | vila de tratadores e sucateiros |
| `vila_cinzal` | Vila Cinzal | settlement | oeste | vila agrícola de cinza, à sombra do bosque |
| `posto_belograd` | Posto Belograd | settlement | norte (borda) | **na borda da névoa**; saída futura p/ Primeira Camada |

### Nós de exploração (12)

| description_key | Nome | Tipo | enc | Nível | Eixo | Secreta? |
|-----------------|------|:----:|:---:|:-----:|:----:|:--------:|
| `ironfall_gate` 🔒 | Portão da Encosta | passage | 0.10 | 1 | sul | — |
| `cinzas_forest` 🔒 | Floresta das Cinzas | field | 0.25 | 2–3 | oeste-sul | → Gruta dos Sinos |
| `estrada_pedagio` | Estrada do Pedágio | passage | 0.20 | 3 | leste | — |
| `poco_dos_ratos` | Poço dos Ratos | field | 0.30 | 4 | leste-sul | — |
| `suburbio_afogado` | Subúrbio Afogado | field | 0.30 | 4–5 | leste-sul | — |
| `bosque_retorcido` | Bosque Retorcido | field | 0.30 | 5 | oeste | — |
| `ferro_velho` | Ferro-Velho | field | 0.25 | 5 | norte-leste | → Torre Queimada |
| `pedreira_morta` | Pedreira Morta | field | 0.30 | 6 | norte-leste | — |
| `charco_palido` | Charco Pálido | field | 0.35 | 6–7 | norte-centro | — |
| `trilha_contencao` | Trilha da Contenção | passage | 0.35 | 7–8 | norte | → Fenda do Reator |
| `campo_cinzas_alto` | Campo de Cinzas Alto | field | 0.40 | 8–9 | norte | — |
| `campos_de_cinza` | Campos de Cinza | field | 0.20 | 2–3 | oeste-sul | — |

> São 12 nós de exploração (2 já existiam). 3 deles escondem uma passagem secreta
> (coluna "Secreta?").

### Nós secretos (3)

| description_key | Nome | Tipo | secret | Acessível por | unlock_condition |
|-----------------|------|:----:|:------:|---------------|------------------|
| `bell_cave` 🔒 | Gruta dos Sinos | secret | true | Floresta das Cinzas | (definir depois) |
| `burnt_tower` 🔒 | Torre Queimada | secret | true | Ferro-Velho | (definir depois) |
| `fenda_reator` | Fenda do Reator | secret | true | Trilha da Contenção | (definir depois) |

> `unlock_condition` fica **em branco** por ora — você disse que definirá as
> condições depois. A conexão para o nó secreto entra com `is_visible = false` (o
> jogador não vê a saída até descobrir), e o nó tem `is_secret = true`.
> Observação: hoje as 2 secretas existentes penduram numa cadeia (Torre→Gruta). No
> novo desenho cada secreta pende de um **nó de exploração distinto** (mais coerente
> com "passagens escondidas em 3 nós"). O seed vai **reconfigurar** as conexões
> antigas de burnt_tower/bell_cave para o novo layout (não destrói os nós).

---

## 4. Ligações (`node_connections`) — resumo por eixo

Cada linha é bidirecional (o seed cria os dois sentidos). `travel_cost` em estamina;
0 nas saídas seguras imediatas de Ironfall (como já é hoje no Portão).

**Eixo Sul (tutorial):**
- Ironfall ↔ Portão da Encosta (custo 0)
- Portão da Encosta ↔ Campos de Cinza (custo 8)

**Eixo Oeste (Vila Cinzal):**
- Ironfall ↔ Floresta das Cinzas (custo 15) — *já existe*
- Floresta das Cinzas ↔ Campos de Cinza (custo 10)
- Floresta das Cinzas ⇢ **Gruta dos Sinos** (secreta, invisível)
- Campos de Cinza ↔ Bosque Retorcido (custo 12)
- Bosque Retorcido ↔ Vila Cinzal (custo 10)

**Eixo Leste (Rostok):**
- Ironfall ↔ Estrada do Pedágio (custo 12)
- Estrada do Pedágio ↔ Rostok (custo 10)
- Estrada do Pedágio ↔ Poço dos Ratos (custo 12)
- Poço dos Ratos ↔ Subúrbio Afogado (custo 12)

**Eixo Norte (borda / Belograd):**
- Ironfall ↔ Ferro-Velho (custo 15)
- Ferro-Velho ⇢ **Torre Queimada** (secreta, invisível)
- Ferro-Velho ↔ Pedreira Morta (custo 14)
- Ironfall ↔ Charco Pálido (custo 16)
- Charco Pálido ↔ Trilha da Contenção (custo 16)
- Trilha da Contenção ⇢ **Fenda do Reator** (secreta, invisível)
- Trilha da Contenção ↔ Campo de Cinzas Alto (custo 18)
- Campo de Cinzas Alto ↔ Posto Belograd (custo 20)

> Belograd é o **mais distante** (soma de custos alta desde Ironfall) — coerente com
> "na borda, pode ser mais distante". A saída para a próxima zona parte de Belograd
> e está **bloqueada** (nó/conexão futura, não criada agora).

---

## 5. Distribuição de monstros (`node_spawns`)

Pesos ponderam o sorteio no nó. Faixa por eixo/nível, coerente com o bestiário.
Bosses ficam em **nós de covil** (spawn próprio, `weight` único; recomendável não
misturar com fauna comum). Alguns bosses moram em **nós secretos** — recompensa por
explorar.

### Exploração comum (por nó)

| Nó | Nível | Spawns (peso) |
|----|:-----:|---------------|
| Portão da Encosta | 1 | rato_de_esgoto(120), corvo_carnical(90), rato_da_bruma(100) |
| Campos de Cinza | 2–3 | cao_vira_lata_faminto(100), corvo_carnical(70), saqueador_esfarrapado(80) |
| Floresta das Cinzas | 2–3 | rato_da_bruma(120), javali_das_cinzas(70), corvo_de_tres_olhos(20,raro) |
| Estrada do Pedágio | 3 | bandido_de_estrada(110), saqueador_esfarrapado(80), sentinela_tombada(40) |
| Poço dos Ratos | 4 | rato_da_bruma_alfa(60), rato_de_esgoto(120), coletor_de_sucata(60) |
| Subúrbio Afogado | 4–5 | aranha_da_teia_cinza(90), homem_da_bruma(70), carne_reptante(50) |
| Bosque Retorcido | 5 | veado_espectral(40,raro), sabujo_da_borda(90), enxame_de_mariposas(70) |
| Ferro-Velho | 5 | automato_de_carga(90), coletor_de_sucata(80), vigia_ocular(50) |
| Pedreira Morta | 6 | urso_esfolado(70), saqueador_veterano(80), vigia_ocular(60) |
| Charco Pálido | 6–7 | carne_reptante(80), cultista_da_fumaca(80), farmaceutico_renegado(30,raro) |
| Trilha da Contenção | 7–8 | cultista_transfigurado(60), colosso_enferrujado(30,raro), aberracao_de_veu_fino(40) |
| Campo de Cinzas Alto | 8–9 | aberracao_de_veu_fino(70), ninho_ambulante(30,raro), colosso_enferrujado(40) |

### Bosses (nós de covil)

| Boss | Nó (covil) | Acesso | Arma épica dropada (classe) |
|------|-----------|--------|-----------------------------|
| A Mãe dos Canos (matriarca_dos_ratos) | **Poço dos Ratos** (fundo) | nó de exploração; spawn de boss dedicado | presa_da_matriarca (Vagante) |
| O Capataz (capataz_ferrugem) | **Torre Queimada** (secreta) | passagem secreta em Ferro-Velho | martelo_do_capataz (Exilado) |
| O Primeiro Convertido (profeta_da_fumaca) | **Gruta dos Sinos** (secreta) | passagem secreta na Floresta das Cinzas | cutelo_ritual (Confessor) |
| Presságio (alfa_da_alcateia) | **Bosque Retorcido** (clareira) | nó de exploração; spawn de boss dedicado | rifle_do_cacador (Cronista) |
| O Que Espia de Volta (coisa_da_borda) | **Fenda do Reator** (secreta) | passagem secreta na Trilha da Contenção | projetor_de_esporos (Arauto) |

> Assim, **2 bosses** ficam em nós de exploração normais (Mãe dos Canos, Presságio)
> e **3 bosses** ficam nas **3 passagens secretas** — dando peso real a explorar os
> segredos (e a "coisa da borda", o boss-formatura, mora na fenda mais ao norte).
> Recomendação técnica: bosses com `spawn_type = 'guaranteed'` no covil (encontro
> único/raro), separado da fauna. Como o motor ainda é 1x1 e sem re-spawn especial,
> o seed pode usar um `node_spawns` de peso alto só do boss no nó-covil, ou uma flag
> futura. Ajustável quando a IA de boss (adds/fases) existir.

---

## 6. Notas para o seed (Sub-parte 2)
- Reaproveitar os 5 nós existentes (Ironfall, Portão, Floresta, Torre, Gruta) por
  `description_key`; **não** recriar.
- Criar 3 assentamentos + 10 nós de exploração novos + 1 secreto novo (Fenda do
  Reator). Total da região: 4 settlements + 12 exploração + 3 secretos = **19 nós**.
- Reconfigurar as conexões de Torre Queimada / Gruta dos Sinos para o novo layout
  (penduradas em Ferro-Velho e Floresta das Cinzas, respectivamente).
- Conexões secretas: `is_visible = false`; nó `is_secret = true`; `unlock_condition`
  em branco (definir depois).
- `node_spawns`: limpar spawns por-tipo genéricos da região e semear **por nó**
  conforme a seção 5 (mais controlável que por tipo).
- Bosses: spawn dedicado no nó-covil.
- Belograd: sem saída para a próxima zona por ora (só o assentamento + lembrete de
  borda na descrição/`description_key`).
