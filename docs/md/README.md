# Documentação de Design — Mists of Krakóvia

Esta pasta contém a documentação de design em **Markdown**, que é a **fonte de
trabalho viva do projeto**: reflete o que o jogo **é e será**, incorporando as
decisões já implementadas.

Os **PDFs originais** em `docs/*.pdf` são a **ideia inicial de planejamento**
(arquivo canônico/histórico). Quando o código diverge do PDF, **vale o que está
nos MDs**. Os PDFs são mantidos como referência da concepção original.

## Convenções

- 🔮 **Planejado** — descrito no design, mas ainda **não implementado**.
- Cada documento de sistema tem, quando relevante, um **apêndice** registrando o
  que o PDF previa e foi substituído.
- Os documentos de **lore e princípios** (Lore, Core Pillars) são estáveis — não
  mudam com a implementação.

## Índice

| Documento | Conteúdo | PDF de origem |
|-----------|----------|---------------|
| [Core Pillars](core-pillars.md) | 7 princípios de design | `Mists of Krakovian Core Pillars.pdf` |
| [Lore (Volume I)](lore.md) | História canônica absoluta (Ætherium, Cataclisma, Herdeiros) | `mists_of_krakovia_lore_v2.pdf` |
| [Mundo Atual (Volume II)](mundo-atual.md) | Camadas da névoa, facções, Vagantes, classes narrativas | `mists_of_krakovia_mundo_atual_v1.pdf` |
| [Personagem e Combate (Volume III)](volume-iii-personagem-e-combate.md) | Atributos, derivados, perícias, combate, progressão, morte | `mists_of_krakovia_gameplay_v1.pdf` |
| [Interface e Gameplay (Volume IV)](volume-iv-interface-e-gameplay.md) | Interface, navegação, produção, caça, NPCs, multiplayer, monetização | `mists_of_krakovia_interface_gameplay_v2.pdf` |
| [Classes (Volume V)](volume-v-classes.md) | 5 classes, habilidades nv1–10, cooldown por Velocidade | `mists_of_krakovia_classes_v2.pdf` |
| [Roadmap](roadmap.md) | Fases 0–6 do desenvolvimento | `Mists of Krakovian Roadmap.pdf` |
| [Arquitetura MVP](arquitetura-mvp.md) | Loop principal, escopo e sistemas do MVP | `Mists_of_Krakovia_Documento_01_Arquitetura_MVP.pdf` |

> Nota: `docs/Master Document.pdf` é uma cópia do Volume V (classes) — não tem MD
> próprio; ver [Classes](volume-v-classes.md).

## Como manter

Quando uma regra mudar no jogo, **atualize o MD correspondente** (é o que o código,
os specs e o agente consultam). O PDF permanece como registro da ideia original.
Ao implementar algo 🔮, remova a marca e mova o conteúdo para o corpo como regra
vigente.
