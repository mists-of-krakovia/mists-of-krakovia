# Spec 1 — Sistema de Perícias + Etapa de Criação

Status: rascunho para aprovação
Fontes de verdade (atuais em Markdown; PDFs são o planejamento inicial):
`docs/md/volume-iii-personagem-e-combate.md` (Volume III — Perícias),
`docs/md/volume-iv-interface-e-gameplay.md` (Volume IV — criação).
Originais: `docs/mists_of_krakovia_gameplay_v1.pdf`,
`docs/mists_of_krakovia_interface_gameplay_v2.pdf`.

## Objetivo

Introduzir o sistema de perícias (campo e combate) como fundação para combate,
produção e testes de campo futuros. Inclui a etapa de distribuição de perícias na
criação do personagem e a **página de Perícias in-game onde o jogador distribui
os pontos** (iniciais e os ganhos por nível no futuro).

Este spec **não** implementa combate, habilidades de classe, produção nem testes
de perícia — apenas o modelo de dados, a atribuição/distribuição de pontos e a
visualização. Isso o torna testável de forma isolada.

## Terminologia — Perícia ≠ Habilidade (importante)

- **Perícia** (`skill` / `character_skills`): treinamento em armas, armaduras e
  técnicas (campo/combate). Nível 0–10, cresce por pontos investidos, governada por
  um atributo. É o que este spec trata. Ex.: "Armas Brancas Leves nível 3".
- **Habilidade** (Volume V — classes): poderes ativos/passivos/ultimate de classe,
  desbloqueados por **nível do personagem** e com **requisito de perícia**, usam
  **cooldown**. NÃO vivem em `character_skills`; serão modeladas no spec de Combate.
  Ex.: "Navalha Veloz" (requer Armas Brancas Leves ≥ 1).
- Relação: Habilidades **dependem** de Perícias (perícias são pré-requisito). Por
  isso Perícias vêm primeiro.
- Nota: o enum `skill_type` tem também `production` (perícias de coleta/produção que
  crescem por uso — Volume IV). Fora deste spec.

## Escopo

### Perícias de Campo (14) — cada uma governada por um atributo base
Engenharia (INT), Alquimia (INT)*, Medicina (INT)*, Sobrevivência (RES),
Furtividade (AGI), Negociação (PER), Investigação (PER), Religião (SAN),
Destreza Manual (AGI), Arqueologia (PER), Liderança (PER).
(*) requerem treinamento mínimo para uso — apenas metadado por enquanto.

### Perícias de Combate (12)
Armas Brancas Leves (AGI), Armas Brancas Pesadas (FOR), Armas Brancas
Industriais (FOR/AGI), Armas de Fogo Leves (PER), Armas de Fogo Pesadas (PER),
Artilharia de Campo (INT), Dispositivos de Combate (INT), Armaduras Leves (AGI),
Armaduras Pesadas (RES), Escudos e Bloqueio (RES), Medicina de Combate (INT),
Combate Desarmado (AGI/FOR).

### Perícias iniciais por classe (nível 2)
- Vagante das Névoas: Armas Brancas Leves, Armas de Fogo Leves, Armaduras Leves
- Arauto do Conclave: Dispositivos de Combate, Armaduras Leves, Medicina de Combate
- Exilado de Ferro: Armas Brancas Pesadas, Armaduras Pesadas, Escudos e Bloqueio
- Confessor do Véu: Medicina de Combate, Armaduras Leves, Armas Brancas Leves
- Cronista das Ruínas: Armas de Fogo Leves, Armaduras Leves, Combate Desarmado

### Regras de pontos (Volume III)
- Pontos de perícia de **campo** na criação: `1 + MG_INT` (MG = letra do Intelecto, 1..7).
- Pontos de perícia de **combate** livres na criação: `3`.
- (Progressão por nível — +1 combate/nível e +campo/nível — fica fora deste spec;
  será tratada no spec de progressão de nível.)

## Requisitos

### R1 — Catálogo de perícias versionado
O conjunto de perícias (nome, tipo, atributo base, se requer treinamento) deve
existir como fonte única, versionada, usada por backend e frontend.

### R2 — Atribuição inicial na criação
Ao criar um personagem:
- As 3 perícias de combate da classe entram em `character_skills` com `level = 2`.
- Os pontos de campo (`1 + MG_INT`) e de combate livres (`3`) distribuídos pelo
  jogador entram como incrementos de `level` nas perícias escolhidas.
- Requisito de atributo de cada perícia é respeitado (não pode investir em perícia
  cujo requisito de atributo não é atendido).

### R3 — Rastreamento de pontos disponíveis
`character_attributes` (ou tabela equivalente) deve registrar pontos de perícia de
campo e de combate ainda não gastos, para uso futuro (progressão de nível).

### R4 — Etapa de criação de perícias (frontend)
Nova etapa no fluxo de criação, após atributos: duas abas (Campo e Combate),
contador de pontos por grupo, perícias com requisito não atendido em cinza.
Perícias iniciais da classe aparecem pré-marcadas (nível 2, não editáveis para baixo).

### R5 — Página de Perícias in-game (interativa)
A página "Perícias" (hoje placeholder) exibe as perícias do personagem por tipo
(nível, atributo base) E permite **distribuir os pontos disponíveis** (campo/combate).
Investir respeita requisito de atributo e teto de nível (0–10). Um endpoint aplica a
distribuição de forma validada no backend. É a mesma tela usada tanto para pontos
iniciais quanto para pontos ganhos por nível (progressão futura).

### R6 — Compatibilidade
Personagens já existentes (sem perícias) não devem quebrar: a UI tolera lista vazia.
Não há migração retroativa de dados — os pontos a distribuir aparecem na própria
página de Perícias (mesmo mecanismo da progressão por nível), então um personagem
antigo simplesmente terá pontos disponíveis para gastar lá.

## Fora de escopo
Combate, habilidades de classe, produção/coleta, testes de perícia, progressão de
nível, e a redistribuição paga (monetização).

## Decisões (resolvidas)
1. **Catálogo**: tabela `skills_catalog` versionada (migration + seed). [aprovado]
2. **Pontos disponíveis**: colunas `field_skill_points`/`combat_skill_points` em
   `character_attributes`. [aprovado]
3. **Retroatividade**: sem migração de dados. Pontos são distribuídos na página de
   Perícias in-game (mesmo fluxo da progressão por nível). [aprovado]
