# Bestiário — Região Inicial (Zona Livre / Borda de Ironfall)

> **Documento de conteúdo, pronto para virar seed.** Ainda **não está no banco**.
> Descreve o bestiário da primeira região do jogo (a Zona Livre e as bordas ao
> redor de Ironfall). Serve de fonte para popular `enemy_catalog`, `node_spawns` e
> as `loot_table` quando formos semear.
>
> Fontes de coerência: `docs/md/mundo-atual.md` (Zona Livre: névoa baixa, perigo
> convencional; Irmandade da Fumaça Negra forte em Ironfall), `docs/md/lore.md`,
> `docs/md/volume-iii-personagem-e-combate.md` (derivados/combate) e
> `.kiro/specs/inventario/` (itens/loot).

---

## 1. Coerência regional (regras do bestiário)

A região inicial é **Zona Livre e bordas** — o mundo fora da névoa densa:

- **Névoa baixa.** `mist_resistance` dos inimigos é baixa (0–3); nada aqui é uma
  aberração de névoa profunda. As criaturas realmente monstruosas (coordenadas,
  saturadas de Ætherium) ficam para as **camadas** internas (conteúdo futuro).
- **Pouca tecnologia.** A tecnologia que aparece é **pré-Cataclisma enferrujada**
  (autômatos de guarda quebrados) ou **improvisada** (bandidos com ferro velho).
  Nada de dispositivos de Ætherium, drones, nem trajes selados.
- **Perigo majoritariamente convencional:** fauna comum e fauna **levemente
  alterada** pela borda da névoa, humanos (bandidos, desertores, cultistas da
  Fumaça Negra em estágio inicial de mutação) e autômatos enferrujados.
- **Escala de nível 1–10** dentro da região, com dificuldade crescente conforme o
  jogador se afasta de Ironfall rumo ao norte (borda da Primeira Camada).
- Tudo aqui deve parecer **"o começo"**: assustador para um novato, mas trivial
  perto do que vem depois.

### Arquétipos presentes (famílias)
1. **Fauna comum** — animais não (ou mal) afetados: ratos, cães, corvos, lobos.
2. **Fauna alterada (leve)** — animais tocados pela borda da névoa: mutação sutil,
   agressividade, pequenas deformações. Sem poderes de névoa "sérios".
3. **Humanos** — bandidos, saqueadores, desertores da Legião, cultistas iniciantes
   da Irmandade da Fumaça Negra. Usam armas improvisadas e táticas simples.
4. **Autômatos enferrujados** — máquinas de guarda pré-Cataclisma cumprindo ordens
   esquecidas. Lentos ou implacáveis, mas "burros".
5. **Mutados leves** — humanos/animais que passaram tempo demais na borda; o elo
   com as camadas internas, ainda em grau baixo.

---

## 2. Convenção de campos (mapeia 1:1 para `enemy_catalog`)

Cada monstro abaixo tem os campos que a tabela `enemy_catalog` espera:

| Campo | Significado |
|-------|-------------|
| `slug` | identificador único (snake_case) |
| `name` | nome exibido |
| `level` | 1–10 |
| `hp_max` | pontos de vida |
| `attack` | ataque base (usado por Rápido/Forte) |
| `defense` | defesa |
| `speed` | velocidade (iniciativa/ações extras) |
| `accuracy` | acerto |
| `evasion` | evasão |
| `crit_chance` | % de crítico |
| `crit_damage` | dano crítico (catálogo guarda em %, ex.: 150) |
| `mist_resistance` | resistência à névoa (baixa nesta região) |
| `xp_reward` | XP ao derrotar |
| `ai_profile` | `attacker_simple` (só ataca) — único perfil implementado hoje |
| `attack_types` | subset de `["quick","strong"]` |
| `is_rare` | raro (bestiário/spawn menor) |
| `loot_table` | `[{ item_slug, chance(0..1), min, max }]` |
| `description` | aparência/comportamento (fiel à região) |

> **Calibração (âncora dos 3 já existentes):** rato_da_bruma nv1 (HP 34, ATK 12),
> vagante_corrompido nv2 (HP 52, ATK 18), sabujo_de_ferro nv3 (HP 80, ATK 26). Os
> valores abaixo seguem a mesma curva aproximada por nível:
>
> | Nível | HP base | ATK base | Defesa | XP |
> |:-----:|:-------:|:--------:|:------:|:--:|
> | 1 | 28–36 | 10–13 | 2–4 | 12–16 |
> | 2 | 45–58 | 16–20 | 5–8 | 18–24 |
> | 3 | 70–85 | 24–28 | 10–13 | 24–30 |
> | 4 | 95–115 | 30–36 | 14–18 | 32–40 |
> | 5 | 120–145 | 38–45 | 18–24 | 42–52 |
> | 6 | 150–180 | 46–54 | 24–30 | 55–70 |
> | 7 | 185–220 | 55–65 | 30–38 | 72–90 |
> | 8 | 225–270 | 66–78 | 38–46 | 95–120 |
> | 9 | 275–330 | 80–95 | 46–56 | 125–160 |
> | 10 (boss) | 380–520 | 95–130 | 55–75 | 200–320 |
>
> `ai_profile` é `attacker_simple` para todos por ora (único implementado). Perfis
> `defensive`/`caster` já existem no enum e ficam marcados 🔮 onde faria sentido.

### Itens de loot referenciados
Slugs **que já existem** no catálogo (Spec 3): `sucata_metal`, `essencia_nevoa`,
`pocao_cura`, `frasco_veneno`, `granada_quimica`, `granada_gas`, `faca_enferrujada`,
`pistola_ferrugem`, `escudo_madeira`, `capuz_couro`, `luvas_couro`,
`calcas_reforcadas`, `colete_couro`.

Slugs **novos sugeridos** (marcados 🆕 — criar junto no seed do bestiário):
`couro_de_besta`, `dente_afiado`, `pelugem_rasgada`, `pena_negra`, `garra_curva`,
`osso_roido`, `engrenagem_enferrujada`, `oleo_espesso`, `nucleo_apagado`,
`fiacao_de_cobre`, `panos_imundos`, `moeda_antiga`, `frasco_vazio`,
`raizes_retorcidas`, `carne_mutada`, `cristal_opaco` (fragmento fraco de Ætherium),
`marca_da_fumaca` (item de facção/quest da Irmandade).

---

## 3. Fauna comum (níveis 1–3)

### rato_da_bruma 🔒(já no banco)
Já semeado (nv1). Roedor mutado leve; rápido e covarde. Mantido como referência.

### rato_de_esgoto
- **Nível** 1 · **HP** 30 · **ATK** 10 · **DEF** 2 · **SPD** 11 · **ACC** 13 · **EVA** 8
- **crit** 4% / 150 · **mist_res** 0 · **XP** 12 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `sucata_metal`(0.3,1,1), `osso_roido`🆕(0.25,1,1)
- **Aparência:** rato grande e sarnento dos canos de Ironfall, dentes amarelos e
  cauda pelada. Não é da névoa — é só fome e sujeira. Ataca em número.

### corvo_carnical
- **Nível** 1 · **HP** 26 · **ATK** 11 · **DEF** 2 · **SPD** 15 · **ACC** 15 · **EVA** 12
- **crit** 6% / 150 · **mist_res** 0 · **XP** 13 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `pena_negra`🆕(0.5,1,2)
- **Aparência:** corvo grande de olhos vidrados que ronda os campos de cinza.
  Rápido, difícil de acertar, bica os olhos. Mau agouro nas histórias locais.

### cao_vira_lata_faminto
- **Nível** 2 · **HP** 48 · **ATK** 16 · **DEF** 5 · **SPD** 12 · **ACC** 14 · **EVA** 8
- **crit** 5% / 150 · **mist_res** 0 · **XP** 18 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `pelugem_rasgada`🆕(0.4,1,1), `dente_afiado`🆕(0.2,1,1)
- **Aparência:** cão de rua esquelético, pelo em tufos, rosnado constante. Anda em
  matilha pequena. Convencional — mas a fome o torna perigoso.

### javali_das_cinzas
- **Nível** 3 · **HP** 82 · **ATK** 25 · **DEF** 12 · **SPD** 9 · **ACC** 13 · **EVA** 5
- **crit** 5% / 155 · **mist_res** 1 · **XP** 26 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `couro_de_besta`🆕(0.5,1,1), `carne_mutada`🆕(0.2,1,1)
- **Aparência:** javali corpulento coberto de cinza seca, presas tortas. Investe em
  linha reta e é difícil de derrubar. Carne dura, levemente alterada.

### corvo_de_tres_olhos
- **Nível** 3 · **HP** 70 · **ATK** 24 · **DEF** 9 · **SPD** 16 · **ACC** 18 · **EVA** 14
- **crit** 9% / 155 · **mist_res** 2 · **XP** 28 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** true
- **loot** `pena_negra`🆕(0.6,1,2), `cristal_opaco`🆕(0.05,1,1)
- **Aparência:** corvo raro com um terceiro olho leitoso na testa — primeiro sinal
  da borda da névoa na fauna. Prevê golpes; esquiva alto. Presságio entre os locais.

---

## 4. Fauna alterada leve (níveis 2–6)

### rato_da_bruma_alfa
- **Nível** 2 · **HP** 55 · **ATK** 19 · **DEF** 6 · **SPD** 13 · **ACC** 15 · **EVA** 9
- **crit** 6% / 150 · **mist_res** 2 · **XP** 22 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `carne_mutada`🆕(0.3,1,1), `dente_afiado`🆕(0.3,1,2), `essencia_nevoa`(0.15,1,1)
- **Aparência:** o rato que cresceu demais — do tamanho de um cão, pelo em placas
  endurecidas e olhos que brilham fraco. Lidera ninhadas de rato_da_bruma.

### sabujo_da_borda
- **Nível** 4 · **HP** 100 · **ATK** 31 · **DEF** 14 · **SPD** 15 · **ACC** 17 · **EVA** 10
- **crit** 7% / 155 · **mist_res** 3 · **XP** 34 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `couro_de_besta`🆕(0.5,1,1), `garra_curva`🆕(0.3,1,1), `essencia_nevoa`(0.2,1,1)
- **Aparência:** cão grande deformado pela exposição — costelas expostas, mandíbula
  aberta demais, pele com bolhas cristalizadas. Caça em dupla. Uiva antes de atacar.

### aranha_da_teia_cinza
- **Nível** 4 · **HP** 92 · **ATK** 30 · **DEF** 13 · **SPD** 17 · **ACC** 18 · **EVA** 15
- **crit** 8% / 155 · **mist_res** 2 · **XP** 36 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `frasco_veneno`(0.25,1,1), `pelugem_rasgada`🆕(0.3,1,1)
- **Aparência:** aranha do tamanho de um gato, abdômen inchado de fluido esverdeado.
  Tece nas ruínas de subúrbio. Peçonhenta (🔮 futuro: aplicar veneno via AI caster).

### veado_espectral
- **Nível** 5 · **HP** 125 · **ATK** 38 · **DEF** 18 · **SPD** 20 · **ACC** 19 · **EVA** 18
- **crit** 9% / 160 · **mist_res** 3 · **XP** 44 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `couro_de_besta`🆕(0.5,1,2), `cristal_opaco`🆕(0.08,1,1), `essencia_nevoa`(0.3,1,1)
- **Aparência:** cervo pálido, quase translúcido, com chifres que parecem galhos
  petrificados. Move-se rápido e some entre a névoa baixa. Belo e errado.

### urso_esfolado
- **Nível** 6 · **HP** 175 · **ATK** 52 · **DEF** 28 · **SPD** 11 · **ACC** 16 · **EVA** 6
- **crit** 6% / 160 · **mist_res** 3 · **XP** 66 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `couro_de_besta`🆕(0.7,1,2), `carne_mutada`🆕(0.4,1,2), `garra_curva`🆕(0.4,1,1)
- **Aparência:** urso enorme cuja pele se soltou em partes, expondo músculo
  cristalizado. Lento, mas cada golpe derruba. Guarda território com fúria.

### enxame_de_mariposas
- **Nível** 5 · **HP** 110 · **ATK** 40 · **DEF** 14 · **SPD** 22 · **ACC** 20 · **EVA** 20
- **crit** 10% / 155 · **mist_res** 4 · **XP** 46 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `pelugem_rasgada`🆕(0.4,1,2), `essencia_nevoa`(0.25,1,1)
- **Aparência:** nuvem densa de mariposas cinzentas de asas com padrão de olho.
  Individualmente inofensivas; em enxame, cobrem o rosto e sufocam. Difícil de
  acertar (evasão alta), pouca defesa.

---

## 5. Humanos (níveis 2–7)

Bandidos, desertores e cultistas iniciantes. Perigo convencional; deixam equipamento
improvisado e moeda.

### saqueador_esfarrapado
- **Nível** 2 · **HP** 50 · **ATK** 17 · **DEF** 6 · **SPD** 12 · **ACC** 15 · **EVA** 9
- **crit** 5% / 150 · **mist_res** 1 · **XP** 20 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `faca_enferrujada`(0.2,1,1), `panos_imundos`🆕(0.4,1,1), `moeda_antiga`🆕(0.3,1,3)
- **Aparência:** homem magro de casaco furado e faca cega, olhos nervosos. Rouba por
  necessidade, foge se puder. O primeiro humano hostil que o jogador encontra.

### bandido_de_estrada
- **Nível** 3 · **HP** 78 · **ATK** 26 · **DEF** 11 · **SPD** 13 · **ACC** 16 · **EVA** 10
- **crit** 6% / 150 · **mist_res** 1 · **XP** 27 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `faca_enferrujada`(0.25,1,1), `couro_de_besta`🆕(0.2,1,1), `moeda_antiga`🆕(0.4,2,5)
- **Aparência:** salteador de couro remendado com um facão e um sorriso ruim.
  Trabalha em duplas nas passagens. Exige "pedágio" antes de atacar.

### atirador_emboscado
- **Nível** 4 · **HP** 90 · **ATK** 33 · **DEF** 12 · **SPD** 16 · **ACC** 20 · **EVA** 12
- **crit** 10% / 160 · **mist_res** 1 · **XP** 38 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `pistola_ferrugem`(0.15,1,1), `fiacao_de_cobre`🆕(0.3,1,2), `moeda_antiga`🆕(0.4,2,6)
- **Aparência:** bandido com uma pistola de tambor emperrado, escondido atrás de
  escombros. Acerta de longe, frágil no corpo a corpo. Alta precisão.

### desertor_da_legiao
- **Nível** 5 · **HP** 135 · **ATK** 42 · **DEF** 22 · **SPD** 13 · **ACC** 18 · **EVA** 9
- **crit** 7% / 160 · **mist_res** 2 · **XP** 50 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `escudo_madeira`(0.2,1,1), `calcas_reforcadas`(0.15,1,1), `moeda_antiga`🆕(0.5,3,8)
- **Aparência:** ex-soldado da Legião dos Exilados em armadura de placas surrada,
  disciplina ainda visível nos golpes. Bloqueia bem. Amargurado, não fala muito.

### cultista_da_fumaca
- **Nível** 5 · **HP** 120 · **ATK** 40 · **DEF** 16 · **SPD** 15 · **ACC** 18 · **EVA** 12
- **crit** 8% / 160 · **mist_res** 6 · **XP** 52 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `marca_da_fumaca`🆕(0.3,1,1), `frasco_veneno`(0.2,1,1), `carne_mutada`🆕(0.25,1,1)
- **Aparência:** adepto iniciante da Irmandade da Fumaça Negra, rosto coberto por
  um pano enegrecido, braço já começando a cristalizar. Busca a mutação de bom
  grado. Resistência à névoa acima do normal (por escolha).

### saqueador_veterano
- **Nível** 6 · **HP** 165 · **ATK** 50 · **DEF** 26 · **SPD** 14 · **ACC** 19 · **EVA** 11
- **crit** 8% / 160 · **mist_res** 2 · **XP** 62 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `pistola_ferrugem`(0.2,1,1), `colete_couro`(0.2,1,1), `moeda_antiga`🆕(0.6,4,10)
- **Aparência:** chefe de bando curtido, cheio de cicatrizes, com uma arma decente
  roubada. Comanda saqueadores menores. Calculista.

### farmaceutico_renegado
- **Nível** 7 · **HP** 190 · **ATK** 58 · **DEF** 30 · **SPD** 16 · **ACC** 21 · **EVA** 13
- **crit** 9% / 165 · **mist_res** 4 · **XP** 78 · **AI** attacker_simple (🔮 caster)
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `granada_quimica`(0.2,1,1), `frasco_veneno`(0.4,1,2), `pocao_cura`(0.3,1,1)
- **Aparência:** ex-alquimista do Conclave expulso por experimentos proibidos,
  avental manchado e frascos ao cinto. Joga compostos corrosivos (🔮 quando houver
  AI caster). Perigoso à distância.

---

## 6. Autômatos enferrujados (níveis 3–8)

Máquinas pré-Cataclisma. Sem névoa; só ferro velho e ordens antigas. Boa fonte de
sucata e componentes.

### sabujo_de_ferro 🔒(já no banco)
Já semeado (nv3). Autômato de guarda enferrujado. Mantido como referência.

### sentinela_tombada
- **Nível** 3 · **HP** 85 · **ATK** 24 · **DEF** 16 · **SPD** 7 · **ACC** 14 · **EVA** 3
- **crit** 4% / 150 · **mist_res** 0 · **XP** 28 · **AI** attacker_simple
- **attack_types** `["strong"]` · **is_rare** false
- **loot** `engrenagem_enferrujada`🆕(0.6,1,2), `sucata_metal`(0.7,2,4)
- **Aparência:** torreta bípede caída de lado, ainda girando o torso para mirar.
  Lenta e sem evasão, mas o golpe é pesado. Range metálico a cada movimento.

### automato_de_carga
- **Nível** 5 · **HP** 150 · **ATK** 39 · **DEF** 26 · **SPD** 8 · **ACC** 15 · **EVA** 3
- **crit** 4% / 150 · **mist_res** 0 · **XP** 48 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `engrenagem_enferrujada`🆕(0.5,1,2), `oleo_espesso`🆕(0.4,1,2), `sucata_metal`(0.8,2,5)
- **Aparência:** autômato industrial de transporte, braços hidráulicos que ainda
  esmagam. Blindado e lento. Cumpre uma rota de entrega que não existe mais.

### vigia_ocular
- **Nível** 6 · **HP** 145 · **ATK** 48 · **DEF** 22 · **SPD** 17 · **ACC** 22 · **EVA** 10
- **crit** 11% / 165 · **mist_res** 0 · **XP** 60 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `fiacao_de_cobre`🆕(0.5,1,2), `nucleo_apagado`🆕(0.15,1,1), `sucata_metal`(0.6,1,3)
- **Aparência:** esfera flutuante presa a um trilho quebrado, lente vermelha que
  ainda varre a área. Dispara feixes curtos e certeiros. Alta precisão, frágil.

### colosso_enferrujado
- **Nível** 8 · **HP** 250 · **ATK** 70 · **DEF** 44 · **SPD** 7 · **ACC** 17 · **EVA** 3
- **crit** 5% / 160 · **mist_res** 0 · **XP** 110 · **AI** attacker_simple
- **attack_types** `["strong"]` · **is_rare** true
- **loot** `nucleo_apagado`🆕(0.4,1,1), `engrenagem_enferrujada`🆕(0.7,2,4), `sucata_metal`(0.9,3,6)
- **Aparência:** autômato de assédio do tamanho de uma casa, meio soterrado, um
  braço-canhão travado. Um único passo faz o chão tremer. Devastador, lentíssimo.

### coletor_de_sucata
- **Nível** 4 · **HP** 98 · **ATK** 30 · **DEF** 20 · **SPD** 10 · **ACC** 15 · **EVA** 5
- **crit** 4% / 150 · **mist_res** 0 · **XP** 36 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `sucata_metal`(0.9,3,6), `engrenagem_enferrujada`🆕(0.5,1,2), `moeda_antiga`🆕(0.2,1,4)
- **Aparência:** pequeno autômato de faxina que ainda "recolhe" tudo que se mexe,
  incluindo pessoas. Braços de pinça. Cheio de sucata acumulada (bom saque).

---

## 7. Mutados leves (níveis 4–9) — o elo com as camadas

Humanos/animais que passaram tempo demais na borda. Grau de mutação ainda **baixo**
(o sério fica para as camadas internas). `mist_resistance` mais alta que a média.

### homem_da_bruma
- **Nível** 4 · **HP** 105 · **ATK** 32 · **DEF** 15 · **SPD** 14 · **ACC** 16 · **EVA** 11
- **crit** 6% / 155 · **mist_res** 7 · **XP** 40 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** false
- **loot** `carne_mutada`🆕(0.4,1,2), `panos_imundos`🆕(0.3,1,1), `cristal_opaco`🆕(0.08,1,1)
- **Aparência:** o que sobra de um Vagante que não voltou a tempo: pele acinzentada,
  olhos brancos, movimentos hesitantes. Ainda veste farrapos. Melancólico e hostil.

### carne_reptante
- **Nível** 5 · **HP** 130 · **ATK** 41 · **DEF** 17 · **SPD** 10 · **ACC** 15 · **EVA** 7
- **crit** 6% / 155 · **mist_res** 8 · **XP** 50 · **AI** attacker_simple
- **attack_types** `["quick"]` · **is_rare** false
- **loot** `carne_mutada`🆕(0.6,1,3), `cristal_opaco`🆕(0.1,1,1), `essencia_nevoa`(0.3,1,2)
- **Aparência:** massa de tecido fundido que já foi mais de um animal, rastejando
  sobre membros a mais. Lenta, resiliente, repugnante. Cresce onde a névoa toca.

### cultista_transfigurado
- **Nível** 7 · **HP** 200 · **ATK** 60 · **DEF** 30 · **SPD** 15 · **ACC** 19 · **EVA** 12
- **crit** 9% / 165 · **mist_res** 12 · **XP** 82 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `marca_da_fumaca`🆕(0.5,1,1), `cristal_opaco`🆕(0.2,1,1), `carne_mutada`🆕(0.4,1,2)
- **Aparência:** cultista da Fumaça Negra em estágio avançado — braço virou garra
  cristalina, meio rosto endurecido. Orgulhoso da transformação. Fanático e forte.

### aberracao_de_veu_fino
- **Nível** 8 · **HP** 235 · **ATK** 68 · **DEF** 34 · **SPD** 18 · **ACC** 20 · **EVA** 15
- **crit** 10% / 165 · **mist_res** 15 · **XP** 105 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `cristal_opaco`🆕(0.3,1,2), `essencia_nevoa`(0.5,1,3), `carne_mutada`🆕(0.5,1,2)
- **Aparência:** criatura sem forma fixa que só existe direito perto da borda —
  bordas que tremeluzem, membros que aparecem e somem. O primeiro monstro que
  parece "de verdade" da névoa. Anuncia o que vem adiante.

### ninho_ambulante
- **Nível** 9 · **HP** 300 · **ATK** 82 · **DEF** 40 · **SPD** 12 · **ACC** 19 · **EVA** 8
- **crit** 8% / 165 · **mist_res** 14 · **XP** 145 · **AI** attacker_simple
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `carne_mutada`🆕(0.7,2,4), `cristal_opaco`🆕(0.3,1,2), `essencia_nevoa`(0.6,2,4)
- **Aparência:** hospedeiro mutado coberto de casulos que pulsam; solta crias
  menores (🔮 quando houver spawn de adds/party inimiga). Lento, altíssimo HP.

---

## 8. Bosses (nível 10) — 5 chefes da região

Chefes nomeados, `is_rare = true`, HP/dano bem acima do comum, XP alto e drop de
qualidade (inclui equipamento e recursos raros). Coerentes com a região: nenhum é
uma "aberração de névoa profunda". `ai_profile` fica `attacker_simple` por ora; o
comportamento especial descrito é 🔮 (depende de AI avançada / adds / party).

### boss_matriarca_dos_ratos — "A Mãe dos Canos"
- **Nível** 10 · **HP** 400 · **ATK** 96 · **DEF** 56 · **SPD** 16 · **ACC** 22 · **EVA** 10
- **crit** 8% / 170 · **mist_res** 5 · **XP** 210 · **AI** attacker_simple (🔮 invoca ratos)
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `presa_da_matriarca`🆕⭐(0.35,1,1) [arma épica — Vagante], `couro_de_besta`🆕(1.0,2,3),
  `essencia_nevoa`(0.8,2,4), `dente_afiado`🆕(1.0,3,5), `colete_couro`(0.5,1,1), `cristal_opaco`🆕(0.3,1,1)
- **Aparência:** rata monstruosa do tamanho de um cavalo, ventre inchado, dezenas de
  filhotes agarrados ao dorso. Rainha dos esgotos e ruínas de Ironfall. 🔮 invoca
  `rato_da_bruma`/`rato_de_esgoto` como adds.
- **Onde:** ruínas subterrâneas / esgotos (nó de covil, futuro).

### boss_capataz_ferrugem — "O Capataz"
- **Nível** 10 · **HP** 520 · **ATK** 100 · **DEF** 75 · **SPD** 8 · **ACC** 18 · **EVA** 3
- **crit** 5% / 165 · **mist_res** 0 · **XP** 240 · **AI** attacker_simple
- **attack_types** `["strong"]` · **is_rare** true
- **loot** `martelo_do_capataz`🆕⭐(0.35,1,1) [arma épica — Exilado], `nucleo_apagado`🆕(1.0,1,2),
  `engrenagem_enferrujada`🆕(1.0,3,6), `sucata_metal`(1.0,5,10), `oleo_espesso`🆕(0.8,2,4), `escudo_madeira`(0.4,1,1)
- **Aparência:** o maior autômato de guarda da região, um capataz de fábrica
  pré-Cataclisma que nunca desligou. Blindagem grossa, martelo hidráulico. Lento,
  quase imbatível de frente — mas burro. Chefe "tanque".
- **Onde:** fábrica abandonada / pátio industrial (futuro).

### boss_profeta_da_fumaca — "O Primeiro Convertido"
- **Nível** 10 · **HP** 430 · **ATK** 104 · **DEF** 52 · **SPD** 17 · **ACC** 22 · **EVA** 14
- **crit** 11% / 175 · **mist_res** 20 · **XP** 260 · **AI** attacker_simple (🔮 buffa cultistas)
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `cutelo_ritual`🆕⭐(0.35,1,1) [arma épica — Confessor], `marca_da_fumaca`🆕(1.0,1,1),
  `cristal_opaco`🆕(0.6,1,2), `carne_mutada`🆕(0.8,2,3), `granada_quimica`(0.4,1,2), `frasco_veneno`(0.5,1,2)
- **Aparência:** líder da célula da Irmandade da Fumaça Negra em Ironfall; meio corpo
  já cristalizado, voz dupla. Prega a mutação como salvação. 🔮 fortalece
  `cultista_da_fumaca` presentes. Chefe de facção — gancho narrativo forte.
- **Onde:** templo/esconderijo da Fumaça Negra (futuro).

### boss_alfa_da_alcateia — "Presságio"
- **Nível** 10 · **HP** 390 · **ATK** 110 · **DEF** 50 · **SPD** 24 · **ACC** 24 · **EVA** 20
- **crit** 14% / 180 · **mist_res** 8 · **XP** 250 · **AI** attacker_simple (🔮 chama a alcateia)
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `rifle_do_cacador`🆕⭐(0.35,1,1) [arma épica — Cronista], `couro_de_besta`🆕(1.0,2,4),
  `garra_curva`🆕(1.0,2,3), `cristal_opaco`🆕(0.4,1,1), `essencia_nevoa`(0.7,2,4)
- **Aparência:** o maior dos sabujos da borda, líder de alcateia, pelo branco de
  cinza e olhos que brilham. Rápido e letal, ataca em investidas. Chefe "assassino"
  — alta velocidade/crit, exige boa reação. 🔮 traz `sabujo_da_borda` como adds.
- **Onde:** campos ao norte, perto da borda da névoa (futuro).

### boss_coisa_da_borda — "O Que Espia de Volta"
- **Nível** 10 · **HP** 470 · **ATK** 106 · **DEF** 58 · **SPD** 19 · **ACC** 21 · **EVA** 16
- **crit** 10% / 175 · **mist_res** 25 · **XP** 300 · **AI** attacker_simple (🔮 fases)
- **attack_types** `["quick","strong"]` · **is_rare** true
- **loot** `projetor_de_esporos`🆕⭐(0.35,1,1) [arma épica — Arauto], `cristal_opaco`🆕(1.0,2,3),
  `essencia_nevoa`(1.0,3,5), `carne_mutada`🆕(0.8,2,4), `nucleo_apagado`🆕(0.2,1,1)
- **Aparência:** a aberração mais forte que ousa chegar à borda — massa instável de
  carne, olhos e cristal que parece observar o jogador antes de atacar. O boss que
  anuncia a Primeira Camada: derrotá-lo é "formatura" da região inicial. Mais alto
  `mist_resistance` do bestiário inicial (ainda modesto perto do que vem). 🔮 muda
  de comportamento com HP baixo.
- **Onde:** o limiar do Posto de Contenção / entrada da névoa (futuro).

---

## 8-B. Armas épicas de boss (⭐ — uma por classe)

Cada boss dropa **uma arma épica** (`rarity = epic`) voltada a uma **classe
distinta**. Coerente com o Volume IV: **épico = drop de boss + fabricação** (item
nomeado). São as primeiras armas acima de `uncommon` do jogo — recompensa de fim de
região. `stats` seguem a convenção do Spec 3 (bônus direto a derivados; só somam).
Requisito de perícia alto (nível 3+) para amarrar à classe-alvo. `is_corrupted`
false (não são itens Corrompidos — isso é 🔮 de camadas avançadas).

| Arma (slug) | Boss | Classe-alvo | Slot | Perícia req. | stats (bônus) |
|-------------|------|-------------|------|--------------|---------------|
| `presa_da_matriarca` | Matriarca dos Ratos | Vagante das Névoas | main_hand | armas_brancas_leves 3 | attack_melee +9, accuracy +4, crit_chance +6, speed +2 |
| `martelo_do_capataz` | Capataz Ferrugem | Exilado de Ferro | main_hand | armas_brancas_pesadas 3 (str_mg 4) | attack_melee +16, defense +4, crit_damage +15 |
| `cutelo_ritual` | Profeta da Fumaça | Confessor do Véu | main_hand | armas_brancas_leves 3 | attack_melee +8, accuracy +3, hp_max +12, mist_resistance +4 |
| `rifle_do_cacador` | Alfa da Alcateia | Cronista das Ruínas | main_hand | armas_fogo_leves 3 (per_mg 4) | attack_ranged +14, accuracy +6, crit_chance +5 |
| `projetor_de_esporos` | Coisa da Borda | Arauto do Conclave | main_hand | dispositivos_combate 3 (int_mg 3) | attack_ranged +12, accuracy +4, observation +3, crit_chance +4 |

Descrições (aparência / sabor):
- **Presa da Matriarca** — adaga curva feita de uma presa da rata-mãe, ainda quente.
  Leve, cruel, rápida. A lâmina de quem anda na frente.
- **Martelo do Capataz** — a marreta hidráulica arrancada do braço do autômato,
  reaproveitada como arma de duas mãos. Pesada como uma sentença.
- **Cutelo Ritual** — a lâmina cerimonial da Irmandade, meio cristalizada; corta e
  protege quem crê. Confortável nas mãos de um Confessor.
- **Rifle do Caçador** — o rifle que abateu o alfa (ou que o alfa guardava): cano
  longo, mira fina, feito para o tiro certo à distância.
- **Projetor de Esporos** — dispositivo do Conclave adaptado a partir da própria
  Coisa da Borda: dispara uma nuvem de esporos cristalinos. Arma técnica de Arauto.

> Observação de balanceamento: são fortes para o fim da região, mas ainda `epic`
> "de zona inicial" — bem abaixo do que virá nas camadas. `base_value` alto
> (economia futura). Como são drop de boss (chance ~0.35), não trivializam o loop.

---

## 9. Resumo / índice rápido

**Total: 30 monstros distintos + 5 bosses = 35** (fora os 3 já no banco:
rato_da_bruma, vagante_corrompido, sabujo_de_ferro).

| Família | Monstros | Faixa de nível |
|---------|----------|:--------------:|
| Fauna comum | rato_de_esgoto, corvo_carnical, cao_vira_lata_faminto, javali_das_cinzas, corvo_de_tres_olhos | 1–3 |
| Fauna alterada leve | rato_da_bruma_alfa, sabujo_da_borda, aranha_da_teia_cinza, veado_espectral, urso_esfolado, enxame_de_mariposas | 2–6 |
| Humanos | saqueador_esfarrapado, bandido_de_estrada, atirador_emboscado, desertor_da_legiao, cultista_da_fumaca, saqueador_veterano, farmaceutico_renegado | 2–7 |
| Autômatos | sentinela_tombada, automato_de_carga, vigia_ocular, colosso_enferrujado, coletor_de_sucata | 3–8 |
| Mutados leves | homem_da_bruma, carne_reptante, cultista_transfigurado, aberracao_de_veu_fino, ninho_ambulante | 4–9 |
| **Bosses** | matriarca_dos_ratos, capataz_ferrugem, profeta_da_fumaca, alfa_da_alcateia, coisa_da_borda | 10 |

### Novos itens a criar no seed do bestiário (🆕)
Materiais de fauna: `couro_de_besta`, `dente_afiado`, `pelugem_rasgada`, `pena_negra`,
`garra_curva`, `osso_roido`, `carne_mutada`.
Componentes de autômato: `engrenagem_enferrujada`, `oleo_espesso`, `nucleo_apagado`,
`fiacao_de_cobre`.
Diversos/facção: `panos_imundos`, `moeda_antiga`, `frasco_vazio`, `raizes_retorcidas`,
`cristal_opaco` (fragmento fraco de Ætherium), `marca_da_fumaca`.
Armas épicas de boss (⭐): `presa_da_matriarca`, `martelo_do_capataz`, `cutelo_ritual`,
`rifle_do_cacador`, `projetor_de_esporos` (ver seção 8-B).
> Definir `item_type` (materiais = `resource`; as ⭐ = `weapon`; `moeda_antiga` pode
> virar base da economia futura), `rarity` (materiais common/uncommon;
> `cristal_opaco`/`nucleo_apagado` podem ser `rare`; as ⭐ = `epic`), `weight`,
> `base_value`. `cristal_opaco` é o gancho de Ætherium de grau baixo — coerente com
> a região.

## 10. Notas para a implementação (quando semear)
- **AI:** todos usam `attacker_simple` hoje. Comportamentos 🔮 marcados (invocar adds,
  buffar aliados, fases, veneno) dependem de: perfis `defensive`/`caster` no motor,
  combate multi-inimigo/party (o banco já é party-ready) e efeitos de status por AI.
- **Spawns:** `node_spawns` por nó fica para quando os nós da região existirem
  (sem `spawn_conditions` por ora, conforme decidido). Sugestão de distribuição por
  faixa: nós próximos de Ironfall → nv 1–3; intermediários → 3–6; borda norte →
  6–9; covis/bosses → nós especiais nv 10.
- **Balanceamento:** valores seguem a curva da seção 2 (âncora nos 3 existentes).
  Ajuste fino após testar o combate contra os novos níveis.
- **Bosses:** `is_rare = true`; recomendável spawn garantido em nó de covil, não
  aleatório. Drop inclui equipamento — quando houver itens rare/epic, os bosses são
  a fonte natural (ver Volume IV: épico = drop de boss + fabricação).
