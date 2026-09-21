# Volume V — Sistema de Classes

> **Fonte de verdade viva do projeto.** Reflete o que o jogo **é e será**. O PDF
> original (`docs/mists_of_krakovia_classes_v2.pdf`, rev. v2.0) é a ideia inicial;
> quando o código diverge, vale o que está aqui. 🔮 marca o que ainda não foi
> implementado.
>
> Estado atual: as habilidades de **nível 1–3** das 5 classes estão implementadas
> (tabela `abilities_catalog`, 23 registros: 15 ativas + 8 passivas). Habilidades
> de nível 4–10 e ultimates são 🔮 planejadas.
>
> Nota: o "Master Document.pdf" é uma cópia deste Volume V — não há MD separado
> para ele.

---

## Sistema de Cooldown e Velocidade

Habilidades **não têm custo de recurso** em combate (sem stamina). São controladas
por **cooldown** — turnos de recarga antes de poder reusar.

- **Redução de cooldown por Velocidade:** `MP_AGI × 2%`, teto **40%**. Aplica-se a
  todas as ativas.
- **Ultimates:** teto de redução **20%**, independente da Velocidade.
- Cooldown resultante arredondado para baixo, mínimo 1 turno.
- Implementação: `effectiveCooldown = max(1, floor(base × (1 − min(teto, MP_AGI × 0.02))))`.

| MP Agilidade | Redução | CD base 4 vira | CD base 6 vira |
|--------------|:-------:|:--------------:|:--------------:|
| 5 (E) | 10% | 4 | 6 |
| 8 (D) | 16% | 3 | 5 |
| 11 (C) | 22% | 3 | 5 |
| 14 (B) | 28% | 3 | 4 |
| 17 (A) | 34% | 3 | 4 |
| 20 (S) | 40% | 2 | 4 |

> Substitui o sistema de Stamina de Combate do planejamento antigo. Toda mecânica
> tem explicação por química, mecânica, treinamento ou Ætherium — nada "mágico".

### Estado de implementação por classe (nv1–3)

Legenda: ✅ implementada · 🔮 planejada.

Cada classe tem no mínimo 2 habilidades ofensivas disponíveis cedo. As passivas de
efeito mecânico direto estão ativas; as de gatilho (HP baixo) e de
exploração/informação estão registradas mas 🔮 inertes até os sistemas existirem.

---

## I. O Vagante das Névoas

> A sombra que caminha adiante. Explorador e sobrevivente; lê o silêncio amarelo e
> move-se entre as sombras. Não é herói — é o primeiro a chegar e o último a
> explicar o que viu.

- **Atributos favorecidos:** Agilidade (primário), Percepção (secundário).
- **Perfil:** maior Velocidade e Evasão do jogo; PV mais baixo (alto risco/alta
  recompensa); melhor detecção passiva; acúmulo de Exposição 25% mais lento.
- **Perícias iniciais (nível 2):** Armas Brancas Leves, Armas de Fogo Leves,
  Armaduras Leves.

### Habilidades

| Nível | Nome | Tipo | Estado | Efeito |
|:-----:|------|------|:------:|--------|
| 1 | Navalha Veloz | Ofensiva (CD 3) | ✅ | Dois golpes; 2º a 70% do dano; se ambos acertam, +crit no 2º. |
| 1 | Passo Silencioso | Mobilidade (CD 3) | ✅ | Entra em furtividade: grande bônus de evasão e habilita Emboscada. |
| 1 | Lâmina Afiada | Passiva | ✅ | +8% de Crítico. |
| 1 | Instinto de Fuga | Passiva | 🔮 | PV < 30%: +Velocidade e +Evasão. |
| 1 | Leitura de Névoa | Passiva | 🔮 | Reduz penalidade de Observação na névoa; criaturas furtivas menos eficazes. |
| 1 | Sombra Persistente | Passiva | 🔮 | Passar concede furtividade parcial além da evasão. |
| 3 | Emboscada | Ofensiva (CD 4) | ✅ | Dano ×2.0, ignora 30% da Defesa. **Requer estar em furtividade.** |
| 5 | Véu de Névoa | Defesa/Utilidade | 🔮 | Inimigos −30% acerto contra você por 2 turnos (só em névoa). |
| 7 | Reflexo de Predador | Reativa | 🔮 | Contra-ataque automático ao ter a furtividade quebrada. |
| 9 | Dissolver-se | Fuga | 🔮 | Desengaja sem ataque de oportunidade; entra em furtividade. |
| 10 | **Ultimate: Fantasma da Névoa** | Ultimate | 🔮 | Invisível 3 turnos; crítico garantido; ao sair, próximo ataque ×3 ignora Defesa. |

---

## II. O Arauto do Conclave

> O engenheiro que entrou no campo. Resolve com dispositivos e informação o que
> horas de teoria não resolvem.

- **Atributos favorecidos:** Intelecto (primário), Percepção (secundário).
- **Perfil:** controle de campo, dano em área e suporte técnico; Velocidade e
  Evasão baixas (compensa preparando o campo).
- **Perícias iniciais (nível 2):** Dispositivos de Combate, Armaduras Leves,
  Medicina de Combate.

### Habilidades

| Nível | Nome | Tipo | Estado | Efeito |
|:-----:|------|------|:------:|--------|
| 1 | Granada Química | Ofensiva (CD 3) | ✅ | Dano em área `MP_INT × 2.5` + acúmulo de Exposição. (Custo de item 🔮 adiado.) |
| 1 | Armadilha de Pressão | Controle (CD 2) | ✅ | Dano `MP_INT × 3` + reduz Velocidade do alvo. |
| 1 | Olhos de Engenheiro | Passiva | 🔮 | +Observação para mecanismos/dispositivos. |
| 3 | Tiro de Precisão | Ofensiva (CD 4) | ✅ | Dano ×1.3 + efeito escolhido (aqui: derruba o alvo 1 turno). |
| 5 | Análise de Campo | Suporte | 🔮 | Revela o inimigo e dá +acerto/+crit ao grupo contra ele. |
| 7 | Reparo de Emergência | Suporte | 🔮 | Restaura PV de aliado e remove debuff. |
| 9 | Grade de Contenção | Controle | 🔮 | Barreira mecânica que bloqueia movimento inimigo. |
| 10 | **Ultimate: Protocolo Volkov** | Ultimate | 🔮 | Sobrecarrega todos os dispositivos em campo de uma vez. |

> As passivas restantes do PDF (Adaptação Técnica, Reserva de Componentes,
> Calibração Rápida) são 🔮 planejadas.

---

## III. O Exilado de Ferro

> O soldado que ficou depois que a guerra acabou. Tanque de linha de frente.

- **Atributos favorecidos:** Resistência (primário), Força (secundário).
- **Perfil:** maior PV e Defesa do jogo; Velocidade e Evasão baixíssimas (absorve,
  não esquiva); resistência a empurrão/derrubada.
- **Perícias iniciais (nível 2):** Armas Brancas Pesadas, Armaduras Pesadas,
  Escudos e Bloqueio.

### Habilidades

| Nível | Nome | Tipo | Estado | Efeito |
|:-----:|------|------|:------:|--------|
| 1 | Golpe Pesado | Ofensiva (CD 3) | ✅ | Dano ×2.2 + MP_FOR, ignora 25% da Defesa; −3 Velocidade na próxima rodada. |
| 1 | Provocação | Controle (CD 4) | ✅ | +10% Defesa por 2 turnos; força inimigos a focar nele (aggro latente p/ party). |
| 1 | Pele de Aço | Passiva | ✅ | Defesa passiva adicional (`MP_RES × 0.5`). |
| 1 | Veterano de Campo | Passiva | 🔮 | PV < 15%: recupera 10% do PV máx. uma vez por combate. |
| 3 | Golpe de Escudo | Ofensiva/Controle (CD 4) | ✅ | Dano `MP_FOR × 1.5` + atordoa o alvo por 1 turno. |
| 5 | Fortaleza | Defesa | 🔮 | Dano recebido −50% por 3 turnos (Velocidade 0). |
| 7 | Proteger | Reativa | 🔮 | Intercepta ataque destinado a aliado adjacente. |
| 9 | Quebra-Armadura | Ofensiva | 🔮 | Reduz permanentemente a Defesa do alvo no combate. |
| 10 | **Ultimate: Muralha Viva** | Ultimate | 🔮 | Imunidade 2 turnos + contra-ataque automático total. |

---

## IV. O Confessor do Véu

> O médico de campo que foi longe demais. Aprendeu a bater antes de curar.

- **Atributos favorecidos:** Sanidade (primário), Intelecto (secundário).
- **Perfil:** maior Resistência Mental e alta Resistência à Névoa; cura por poções
  a mais eficiente; suporte real.
- **Perícias iniciais (nível 2):** Medicina de Combate, Armaduras Leves, Armas
  Brancas Leves.

### Habilidades

| Nível | Nome | Tipo | Estado | Efeito |
|:-----:|------|------|:------:|--------|
| 1 | Ataque Envenenado | Ofensiva (CD 3) | ✅ | Dano imediato + veneno `MP_INT × 1.5`/turno por 3 turnos. (Item 🔮 adiado.) |
| 1 | Poção em Área | Suporte (CD 3) | ✅ | Cura em área; **sozinho, cura a si mesmo** (`MP_INT × 4`). (Item 🔮 adiado.) |
| 1 | Mãos que Curam | Passiva | 🔮 | +40% de cura de poções/kits. |
| 3 | Gás Paralisante | Ofensiva/Controle (CD 4) | ✅ | Dano `MP_INT × 2` + paralisa o alvo por 1 turno. |
| 5 | Kit Avançado | Suporte | 🔮 | Cura maior + remove 2 debuffs de um aliado. |
| 7 | Estimulante | Suporte/Utilidade | 🔮 | Buff temporário de atributos num aliado. |
| 9 | Purificação Química | Suporte | 🔮 | Remove Exposição em área. |
| 10 | **Ultimate: Protocolo de Emergência** | Ultimate | 🔮 | Cura em área + estimulantes em todos os aliados. |

> As passivas restantes do PDF (Mente Fortalecida, Leitura de Almas, Desconto da
> Igreja) são 🔮 planejadas.

---

## V. O Cronista das Ruínas

> Veio para entender, não para lutar. Documenta o que encontra; luta à distância.

- **Atributos favorecidos:** Percepção (primário), Intelecto (secundário).
- **Perfil:** maior Acerto do jogo; alta Chance de Crítico; detecção máxima;
  Defesa baixa.
- **Perícias iniciais (nível 2):** Armas de Fogo Leves, Armaduras Leves, Combate
  Desarmado.

### Habilidades

| Nível | Nome | Tipo | Estado | Efeito |
|:-----:|------|------|:------:|--------|
| 1 | Tiro Rápido | Ofensiva (CD 2) | ✅ | Dano ×0.9, +10% Acerto. CD mais curto do jogo. |
| 1 | Ponto Fraco | Ofensiva (CD 3) | ✅ | Próximo ataque +30% dano e ignora 20% da Defesa. |
| 1 | Precisão Natural | Passiva | ✅ | +5% de Crítico e +Acerto. |
| 1 | Olhar Clínico | Passiva | 🔮 | Revela atributos dos inimigos no início do combate. |
| 3 | Improviso Tático | Ofensiva/Utilidade (CD 4) | ✅ | Usa o ambiente: dano `MP_PER × 2` + 50% de chance de atordoar. |
| 5 | Relatório de Campo | Suporte | 🔮 | Buff de acerto/crítico ao grupo por vários turnos. |
| 7 | Tiro Calculado | Ofensiva/Controle | 🔮 | Disparo com efeito escolhido (desarmar/imobilizar/silenciar). |
| 9 | Rota de Fuga | Mobilidade | 🔮 | Fuga garantida sem ataque de oportunidade. |
| 10 | **Ultimate: Dossiê Completo** | Ultimate | 🔮 | Alvo perde toda Defesa e não pode reagir; +crit de todos contra ele. |

> As passivas restantes do PDF (Memória Fotográfica, Rede de Informantes) são 🔮
> planejadas.

---

## Contra-Ataque por classe

O contra-ataque automático (×1.5 do ataque, após uma reação correta) é controlado
por uma flag por classe. **Hoje habilitado para todas** as classes na fase de
teste. 🔮 Meta de design: exclusivo do **Vagante das Névoas**.

---

## Tabela comparativa de classes

Escala 1–5 entre as classes (referência de balanceamento do PDF).

| Atributo | Vagante | Arauto | Exilado | Confessor | Cronista |
|----------|:-------:|:------:|:-------:|:---------:|:--------:|
| PV | 1 | 3 | 5 | 3 | 3 |
| Velocidade | 5 | 2 | 1 | 3 | 3 |
| Evasão | 4 | 2 | 1 | 3 | 3 |
| Defesa (c/ armadura) | 2 | 2 | 5 | 2 | 2 |
| Acerto | 3 | 3 | 2 | 2 | 5 |
| Dano por Ataque | 4 | 3 | 5 | 2 | 3 |
| Dano Contínuo/Área | 2 | 5 | 2 | 4 | 2 |
| Resist. Mental | 2 | 3 | 3 | 5 | 3 |
| Resist. Névoa | 5 | 3 | 2 | 4 | 2 |
| Observação | 5 | 4 | 2 | 3 | 5 |
| Suporte de Grupo | 1 | 4 | 3 | 5 | 4 |
| Util. Fora de Combate | 3 | 3 | 1 | 4 | 5 |

> Os **bônus de derivados por nível** implementados (por classe) estão no Volume
> III, Parte V (Progressão).

## Sinergias entre classes 🔮 (planejado — depende de party)

- **Exilado + Vagante:** tanque provoca; Vagante ataca de flanco com Emboscada.
- **Confessor + Exilado:** sustain máximo (absorve + cura + remove debuffs).
- **Arauto + Vagante:** armadilhas + reposicionamento.
- **Cronista + qualquer:** amplificador universal (buffs de análise ao grupo).
- **Confessor + Arauto:** suporte duplo (controle + cura).
- **Todos os 5:** +110% XP (bônus de número + diversidade — ver Volume IV) e
  cobertura total.

---

## Apêndice — Regras do PDF original alteradas

- **Stamina de combate** → substituída por **cooldown por Velocidade**.
- Habilidades de **nível 4–10** e **ultimates** → 🔮 ainda não implementadas.
- Habilidades que consomem item (Granada, Veneno, Poção) → hoje **sempre usáveis**
  (custo de item adiado até o sistema de inventário de combate).
- Habilidades de suporte a aliado em 1x1: **Poção em Área** cura o self; as demais
  (Proteger, Análise de Campo em grupo) ficam inertes até haver party.
