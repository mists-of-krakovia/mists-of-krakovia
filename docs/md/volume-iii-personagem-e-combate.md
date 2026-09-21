# Volume III — Sistema de Personagem e Combate

> **Fonte de verdade viva do projeto.** Este documento reflete o que o jogo **é e
> será**, incorporando as decisões de design já implementadas. O PDF original
> (`docs/mists_of_krakovia_gameplay_v1.pdf`) permanece como a ideia inicial de
> planejamento; quando o código diverge do PDF, **vale o que está aqui**.
>
> Trechos marcados com 🔮 **Planejado** ainda não foram implementados.

---

## Parte I — Atributos Base

Os seis atributos base definem a estrutura fundamental do personagem. Tudo que ele
faz — atacar, resistir, perceber, sobreviver — deriva desses valores. Crescem por
investimento direto de pontos e alimentam todos os atributos derivados.

- **Força (FOR)** — Potência física bruta. Dano corpo a corpo, capacidade de carga
  e força para armas/armaduras pesadas. Resistência a empurrão e derrubada.
- **Agilidade (AGI)** — Velocidade e precisão de movimento. Iniciativa, evasão,
  velocidade geral. Eficácia de armas leves e mobilidade.
- **Resistência (RES)** — Durabilidade e vitalidade. Pontos de Vida e mitigação de
  dano físico. Reduz penalidades de exaustão em marchas longas.
- **Intelecto (INT)** — Raciocínio e capacidade técnica. Base de Engenharia,
  Alquimia e Medicina. Define os pontos de perícia de campo iniciais.
- **Percepção (PER)** — Atenção e leitura do ambiente. Acerto à distância; detecção
  de ameaças, armadilhas e segredos. Base de Investigação, Arqueologia, Negociação.
- **Sanidade (SAN)** — Estabilidade mental. Resistência aos efeitos da névoa;
  quanto tempo suporta névoa densa. Base de Religião.

### A escala de atributos — F- até S+

Escala de 21 níveis, 7 letras (F, E, D, C, B, A, S) com três graus cada (−,
neutro, +). F é o mínimo funcional; S+ é o ápice absoluto.

| Grau | Mod. Pequeno (MP) | Mod. Grande (MG) | Referência |
|------|------|------|------------|
| F-  | 1  | 1 | Mínimo funcional |
| F   | 2  | 1 | Abaixo da média |
| F+  | 3  | 1 | Fraco mas presente |
| E-  | 4  | 2 | Média baixa |
| E   | 5  | 2 | Pessoa comum |
| E+  | 6  | 2 | Acima da média |
| D-  | 7  | 3 | Treinado |
| D   | 8  | 3 | Bem treinado |
| D+  | 9  | 3 | Profissional |
| C-  | 10 | 4 | Especialista |
| C   | 11 | 4 | Veterano |
| C+  | 12 | 4 | Elite |
| B-  | 13 | 5 | Excepcional |
| B   | 14 | 5 | Mestre |
| B+  | 15 | 5 | Grande mestre |
| A-  | 16 | 6 | Lenda viva |
| A   | 17 | 6 | Pico humano |
| A+  | 18 | 6 | Além do humano comum |
| S-  | 19 | 7 | Transformado |
| S   | 20 | 7 | Ápice |
| S+  | 21 | 7 | Absoluto |

- **Modificador Pequeno (MP):** 1 a 21, o grau exato. Usado em fórmulas de
  derivados, testes e dano.
- **Modificador Grande (MG):** 1 a 7, apenas a letra. Requisito de equipamento e
  de habilidades. Ex.: Força MG ≥ 4 exige pelo menos C-.
  - Implementação: `MG = max(1, ceil(MP / 3))`.

### Distribuição de pontos de atributo

- **Criação:** 5 pontos para distribuir livremente. Nenhum atributo acima de D+
  (máximo +4 sobre a base E = valor 9). Todos começam em E (valor 5).
- **Por nível:** +3 pontos de atributo, sem restrição de distribuição. Ficam
  disponíveis para o jogador gastar na tela de Personagem.

---

## Parte II — Atributos Derivados

Calculados a partir dos atributos base, perícias e equipamentos.

| Derivado | Base | Fórmula |
|----------|------|---------|
| Pontos de Vida (PV) | RES | `20 + (MP_RES × 5)` + bônus de equipamento |
| Estamina | RES | `100 + (MP_RES × 5)` |
| Acerto | PER | `MP_PER × 3` + bônus de perícia de arma + equipamento |
| Ataque C.C. | FOR | `MP_FOR × 2` + bônus de arma |
| Ataque à Distância | PER | `MP_PER × 2` + bônus de arma |
| Defesa | RES + equip. | `MP_RES` + bônus de armadura |
| Chance de Crítico | PER | `3% + (MP_PER × 0.5%)` + bônus de perícia |
| Dano Crítico | FOR / PER | `1.5 + (MP_FOR ou MP_PER) × 0.05` (multiplicador) |
| Velocidade | AGI | `MP_AGI × 2` + bônus de equipamento |
| Evasão | AGI | `MP_AGI × 3` + bônus de perícia + penalidade de armadura |
| Resistência Mental | SAN | `MP_SAN × 3` + bônus de Religião |
| Resistência à Névoa | SAN + equip. | `MP_SAN × 2` + bônus de máscara/traje |
| Observação | PER + INT | `MP_PER + MP_INT` + bônus de Investigação |
| Capacidade de Carga | FOR | `MG_FOR × 10 kg` |

Notas:
- **PV / regeneração:** 🔮 *Planejado* — 1 PV por hora de descanso fora da névoa;
  suspensa dentro da névoa. Hoje o HP só muda em combate, por cura de nível ou
  por respawn.
- **Bônus de nível por classe:** ao subir de nível, além dos pontos de atributo,
  a classe ganha bônus fixos em vários derivados (ver Parte V). Esse bônus é
  guardado separado da fórmula e somado por cima; o jogador vê só o total.
- **Dano Crítico:** começa em 150% e cresce com Força (C.C.) ou Percepção (dist.).
- **Velocidade:** define iniciativa e frequência de ações (ver ações adicionais).

---

## Parte III — Perícias

Perícias são treinamento específico, nível 0–10. Dividem-se em **Campo** e
**Combate**. Cada uma tem um atributo base que a governa.

> **Perícia ≠ Habilidade.** Perícia é treinamento (esta parte). Habilidade é poder
> de classe com cooldown, desbloqueado por nível e com requisito de perícia
> (ver Volume V). Habilidades dependem de perícias como pré-requisito.

### Pontos de perícia

- **Campo, na criação:** `1 + MG_INT` pontos, creditados como disponíveis para o
  jogador gastar na página de Perícias.
- **Combate, na criação:** 0 pontos livres (o personagem já nasce com as 3 perícias
  da classe em nível 2).
- **Por nível:** +1 perícia de campo e +1 perícia de combate.
- Nível 0 = sem treinamento; 10 = mestre. Perícias marcadas com `*` exigem
  treinamento mínimo para uso.

> Diferença em relação ao PDF: o planejamento original dava 3 pontos de combate na
> criação e `1 + MG_INT` de campo *por nível*. A criação foi simplificada — os
> pontos iniciais de combate saíram, e o `1 + MG_INT` passou a ser creditado uma
> vez, na criação.

### Perícias de Campo

| Perícia | Atributo | Descrição resumida | Marcos de nível |
|---------|----------|--------------------|-----------------|
| Engenharia | INT | Projeto/reparo de dispositivos; armadilhas; contenção de névoa. | 5+: modificar armas; 8+: dispositivos com Ætherium |
| Alquimia `*` | INT | Venenos, granadas, gases, estimulantes; Ætherium bruto. | 3+: identifica substâncias; 6+: compostos; 9+: fórmulas pré-Cataclisma |
| Medicina `*` | INT | Ferimentos, doenças, exposição, próteses. | 4+: mutações leves; 7+: cirurgia sem penalidade; 10: mutação avançada |
| Sobrevivência | RES | Forragear, acampar na névoa, rastrear, navegar. | 3+: reduz exaustão; 5+: lê criaturas; 7+: rotas alternativas |
| Furtividade | AGI | Movimento sem detecção; ataques furtivos aumentam dano. | 4+: silêncio na névoa; 6+: cobertura por névoa; 9+: burla sensores |
| Negociação | PER | Persuasão, intimidação, barganha, leitura de intenções. | 3+: detecta contradições; 5+: missões exclusivas; 8+: negocia com Herdeiros |
| Investigação | PER | Pistas ocultas, documentos, armadilhas, reconstrução. | 4+: data objetos; 7+: reconstrói eventos |
| Religião | SAN | Doutrinas da Igreja do Véu Prateado; rituais de purificação. | 3+: reduz Exposição; 6+: identifica Herdeiros; 9+: arquivo pré-Cataclisma |
| Destreza Manual | AGI | Fechaduras, desarmar armadilhas, cofres, próteses em campo. | 4+: segurança krakoviana; 7+: armadilhas de Ætherium |
| Arqueologia | PER | Artefatos e ruínas pré-Cataclisma. | 3+: facção de origem; 5+: passagens ocultas; 8+: inscrições destruídas |
| Liderança | PER | Coordenação de grupo, moral, formações. | 3+: bônus de moral; 6+: nega iniciativa; 9+: buff geral |

> Nota: o catálogo implementado (`skills_catalog`) tem **11 perícias de campo** —
> "Armas Brancas Industriais" foi absorvida por Leves e removida.

### Perícias de Combate

O nível (0–10) soma direto ao acerto, dano ou defesa relevante. Usar equipamento
sem a perícia impõe penalidade severa de acerto e velocidade.

| Perícia | Atributo | Requisito | Impacto por nível |
|---------|----------|-----------|-------------------|
| Armas Brancas Leves | AGI | AGI MG ≥ 2 | +1 Acerto, +0.5 Ataque C.C.; nv5+: ataques duplos |
| Armas Brancas Pesadas | FOR | FOR MG ≥ 3 | +0.5 Acerto, +1 Ataque C.C.; nv5+: ignora parte da Defesa |
| Armas de Fogo Leves | PER | PER MG ≥ 2 | +1 Acerto à dist., +0.5 Ataque; nv5+: tiros consecutivos |
| Armas de Fogo Pesadas | PER | PER MG ≥ 3 | +0.5 Acerto à dist., +1 Ataque; nv5+: ignora cobertura parcial |
| Artilharia de Campo | INT | INT MG ≥ 3, FOR MG ≥ 2 | +1 área de dano, +1 Ataque; nv6+: calibração rápida |
| Dispositivos de Combate | INT | INT MG ≥ 2 | +1 área de efeito, +0.5 dano; nv4+: armadilha como ação rápida |
| Armaduras Leves | AGI | Nenhum | +1 Defesa, −0.2 penalidade de Evasão |
| Armaduras Pesadas | RES | RES MG ≥ 3 | +2 Defesa, −0.5 penalidade de Evasão |
| Escudos e Bloqueio | RES | RES MG ≥ 2 | +2 mitigação de bloqueio, +3% bloqueio completo |
| Medicina de Combate | INT | INT MG ≥ 2 | +10% PV restaurados, −1 custo de ação acima do nv3 |
| Combate Desarmado | AGI/FOR | Nenhum | +0.5 Acerto, +0.5 Ataque; nv6+: imobilizações e desarmes |

> São **11 perícias de combate** no catálogo implementado (a industrial foi
> removida). Bônus aplicados hoje no combate (ponto de partida, calibrável): Armas
> Brancas Leves dá +0.5 Ataque C.C. e +1 Acerto por nível; Armaduras Leves +1
> Defesa/nível; Armaduras Pesadas +2 Defesa/nível.

### Perícias de combate por classe — início (nível 2)

| Classe | Perícias iniciais (nível 2) |
|--------|-----------------------------|
| Vagante das Névoas | Armas Brancas Leves, Armas de Fogo Leves, Armaduras Leves |
| Arauto do Conclave | Dispositivos de Combate, Armaduras Leves, Medicina de Combate |
| Exilado de Ferro | Armas Brancas Pesadas, Armaduras Pesadas, Escudos e Bloqueio |
| Confessor do Véu | Medicina de Combate, Armaduras Leves, Armas Brancas Leves |
| Cronista das Ruínas | Armas de Fogo Leves, Armaduras Leves, Combate Desarmado |

---

## Parte IV — Sistema de Combate

Combate por turnos, 1x1 hoje (o banco já está preparado para grupos/múltiplos
alvos). Cada decisão tem peso; o ambiente é sempre um fator.

### Iniciativa e ordem de turno

- Ordem definida pela **Velocidade** de todos os participantes, do maior ao menor.
- **Empates:** resolvidos por RNG.
- **Ações adicionais por Velocidade:** a cada rodada, quem tem Velocidade ≥ 1.5× a
  do mais lento ganha +1 ação; ≥ 2× ganha +2; etc. Torna Agilidade muito valiosa.

### Ações do jogador

- **Atacar** — escolhe o tipo (ver abaixo).
- **Usar Habilidade** — poder de classe com cooldown (Volume V). Sem custo de
  stamina.
- **Passar** — não age; ganha guarda até o próximo turno.
- **Fugir** — chance por Velocidade vs. inimigo mais rápido:
  `clamp(0.5 + (Vel. jogador − Vel. inimigo) × 0.03, 0.1, 0.95)`. Falha resulta em
  ataque de oportunidade do inimigo mais rápido.
- 🔮 **Usar Item** — planejado (depende do sistema de inventário em combate).

### Tipos de ataque

| Tipo | Estado | Efeito |
|------|--------|--------|
| **Rápido** | ativo | −15% Ataque, +10% Acerto, sem penalidade de Velocidade |
| **Forte** | ativo | +25% Ataque, −3 Velocidade na próxima rodada |
| Precisão | 🔮 planejado | Armas de longo alcance (arcos, armas de fogo). +Crítico. |
| Área | 🔮 planejado | Depende de classe + equipamento (ex.: machado em arco, metralhadora). |

> O **Ataque Padrão do PDF foi removido**. Rápido e Forte são os dois tipos base
> de curto alcance. Contra inimigos que não reagem, a escolha vale pela diferença
> de dano/tempo; o valor tático do tipo aparece na leitura das reações.

### Reações (defesa) — matchup às cegas

Quando um inimigo vai atacar o jogador, o sistema oferece a reação **antes** de
revelar o tipo do ataque. O jogador decide no escuro.

- **Bloquear** e **Desviar** são as reações disponíveis.
- **Matchup correto → 100% de redução (dano zerado):**
  - **Desviar** vence **Ataque Rápido**.
  - **Bloquear** vence **Ataque Forte**.
- **Bloquear errado** (contra um Rápido): ainda **mitiga parte** do dano
  (`perícia Escudos e Bloqueio × 2 + Defesa de armadura`). É a reação segura.
- **Desviar errado** (contra um Forte): falha, dano total (tudo-ou-nada).
- **Uma reação por ciclo de ações inimigas:** ao reagir uma vez, a reação se
  esgota até a próxima ação do jogador. 🔮 *Planejado:* classe/equipamento que
  concedam reações extras.

### Contra-Ataque

Não é uma reação escolhível. É **automático**: dispara quando a reação foi
**correta** (matchup certo), contra o inimigo reagido, causando **×1.5** do ataque
normal. Controlado por flag por classe — hoje habilitado para todas na fase de
teste; 🔮 meta de design: exclusivo do Vagante das Névoas.

### Resolução de ataque — fluxo

1. **Acerto:** `hitChance = clamp(0.5 + (Acerto − Evasão) × 0.03, 0.05, 0.95)`,
   com +0.10 no Ataque Rápido.
2. **Reação** (se o defensor é o jogador e ainda pode reagir): aplica o matchup.
3. **Crítico:** checa Chance de Crítico; confirmado, aplica o Dano Crítico.
4. **Dano:** `round(Ataque × mod. de tipo × (crítico?) − Defesa) + RNG(1–10)`,
   mínimo de 1. Buffs de "próximo ataque" e ignore-defesa entram aqui.
5. **Efeitos:** aplica status (veneno, atordoamento, etc.).
6. **Status:** PV = 0 → derrotado.

### IA de inimigo

- **`attacker_simple`** (inimigos iniciais): só atacam, escolhem um tipo dentre os
  seus `attack_types`, não reagem, não usam habilidades.
- 🔮 *Planejado:* perfis mais ricos (inimigos que reagem, usam habilidades,
  manipulam a névoa).

---

## Parte V — Progressão de Nível/XP

- **Fonte de XP:** cada inimigo derrotado concede seu `xp_reward` (definido por
  inimigo no catálogo). Somado ao vencer o combate.
  - Âncora inicial: monstros do primeiro mapa dão 15–25 XP.
- **Curva:** XP para subir de N → N+1 = `round(100 × N^1.7)`. **Nível máximo 10.**
- **Level-up credita:** +3 pontos de atributo, +1 perícia de combate, +1 de campo.
- **Bônus de derivados por classe ao subir de nível** (guardado separado da
  fórmula; o jogador vê só o total):

| Derivado | Vagante | Arauto | Exilado | Confessor | Cronista |
|----------|:-------:|:------:|:-------:|:---------:|:--------:|
| HP | +3 | +6 | +10 | +6 | +6 |
| Ataque | +2 | +2 | +3 | +1 | +2 |
| Defesa | +1 | +1 | +3 | +1 | +1 |
| Velocidade | +3 | +1 | +1 | +2 | +2 |
| Estamina | +5 | +5 | +6 | +5 | +5 |
| Acerto | +2 | +2 | +1 | +1 | +3 |
| Evasão | +3 | +1 | +1 | +2 | +2 |
| R. Mental | +1 | +2 | +2 | +3 | +2 |
| Carga máx. | +2 | +3 | +5 | +2 | +2 |

- Subir de nível **cura HP e estamina ao máximo**.
- 🔮 Após o nível 10: evoluções de classe (novas habilidades) — planejado.

---

## Parte VI — Encontros e Caçada

- **Caçar** (ação no nó): inicia um combate a partir dos inimigos que podem surgir
  no nó atual (`node_spawns`, sorteio ponderado por peso). Hoje com **100% de
  chance** de encontro (para acelerar testes; será calibrado).
- **Encontro ao mover:** cada nó tem uma `encounter_rate`. Ao mover, se a flag
  `ENCOUNTERS_ON_MOVE` estiver ligada e o destino tiver taxa > 0 e spawns ativos,
  rola-se o encontro. Taxas base por tipo de nó:
  - `passage` (estradas): 0.10 · `field` (campos/zona inicial): 0.25 ·
    `mist`: 0.40 · `settlement`: 0 · `secret`: 0.
  - A flag nasce **desligada** por padrão.
- 🔮 **Buscar/coletar recursos** (`general_search`): planejado (spec de exploração
  futuro); terá taxa de encontro menor.

### Catálogo de inimigos

Inimigos vivem no `enemy_catalog` (atributos, HP, `xp_reward`, IA, `attack_types`,
flags reservadas para o **bestiário** futuro: `is_rare`, `spawn_conditions`,
`loot_table`). Iniciais do mapa de Ironfall:

| Inimigo | Nível | HP | Ataque | Velocidade | XP |
|---------|:-----:|:--:|:------:|:----------:|:--:|
| Rato da Bruma | 1 | 34 | 12 | 12 | 15 |
| Vagante Corrompido | 2 | 52 | 18 | 13 | 20 |
| Sabujo de Ferro | 3 | 80 | 26 | 14 | 25 |

---

## Parte VII — Morte e Respawn

Ao ser derrotado em combate:
- **Respawn** no último ponto salvo pelo jogador (botão "Salvar" em assentamentos;
  o jogo guarda o histórico dos últimos 10 pontos). Sem ponto salvo → Ironfall.
- **Penalidade de XP:** perde 10% do `xp_to_next` (piso 0; **não** regride de
  nível).
- **Penalidade de estamina:** −20 (piso 0).
- **Revive com 50% do HP máximo.**

---

## Parte VIII — A Névoa em Combate 🔮 (planejado, pós-V1.0)

Conteúdo de zonas futuras com mais névoa. Ainda não implementado (o mundo inicial
não tem nós de névoa). Design de referência:

- **Exposição:** por rodada dentro da névoa, sem proteção +1 ponto; com máscara,
  +1 a cada `Resistência à Névoa ÷ 10` rodadas.
- **Penalidades:** 1–5: −5% testes; 6–10: −15% + −5 Velocidade; 11–15: −30% + −10
  Velocidade + alucinações; 16+: incapacitação e mutação acelerada. Redução fora
  da névoa: 1 ponto/minuto de ar limpo.
- **Visibilidade** (armas à distância): 1ª Camada −10%, 2ª −25%, 3ª −40%, 4ª
  (Krakovia) −60% e alcance máximo a 50%.
- **Criaturas:** mutantes não acumulam Exposição; algumas manipulam a névoa local.

---

## Apêndice — Regras do PDF original substituídas

Para referência histórica, o planejamento inicial (PDF v1.0) previa e o projeto
alterou:
- **Ataque Padrão** e as reações **Evasiva**/**Contra-Ataque como escolha** →
  substituídos pelo modelo Rápido/Forte + Bloquear/Desviar às cegas + contra-ataque
  automático.
- **Stamina de combate** para habilidades → substituída por **cooldown por
  Velocidade** (Volume V).
- Pontos de perícia de campo `1 + MG_INT` **por nível** → agora creditados uma vez
  na criação; por nível são +1 campo/+1 combate.
- Etapa de distribuição de perícias na criação → **removida** (personagem começa só
  com as perícias da classe).
