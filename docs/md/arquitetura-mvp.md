# Documento 01 — Arquitetura do MVP

> Escopo e loop do MVP. Fonte:
> `docs/Mists_of_Krakovia_Documento_01_Arquitetura_MVP.pdf`. Anotado com o estado
> atual (✅ · 🔄 · 🔮) e divergências do projeto real.

**Objetivo do MVP:** validar exploração, descoberta, mistério, sobrevivência e
progressão básica.

> **Core Pillar guia:** o jogador deve perseguir **perguntas, não marcadores**.
> Missões existem para revelar mistérios. Informação é a principal recompensa.

## Loop Principal

```
Entrar → Ouvir rumores → Explorar → Encontrar algo estranho → Investigar →
Descobrir informação → Ganhar conhecimento → Desbloquear novas perguntas →
Explorar novamente.
```

> **Regra de ouro:** toda funcionalidade deve criar novas perguntas. Se não cria,
> provavelmente não pertence ao MVP.

## Escopo do MVP (referência do PDF vs. implementado)

- **Assentamento inicial:** Ironfall ✅ (o jogo começa em Ironfall — Distrito
  Central).
  - NPCs previstos no PDF: Capitão Mikhail, Vera Sorokina, Yegor Petrenko, Ivan
    (estalajadeiro). 🔮 NPCs ainda não implementados.
- **Área explorável (PDF):** Ironfall, Portão Norte, Trilho Abandonado, Torre
  Queimada, Bosque Morto, Armazém Sul, Vale da Névoa, Poço Antigo, Caverna do
  Graspa, Ruínas Antigas.
  - **Mundo real implementado:** Ironfall (Distrito Central), Portão da Encosta,
    Floresta das Cinzas, Torre Queimada, Gruta dos Sinos. Os nomes divergem do PDF
    — vale o mundo implementado.
- **Criaturas (PDF):** Rato de Cano, Corvo de Névoa, Cão Ferrugem, Mutante de
  Ironfall, Graspa.
  - **Implementado:** Rato da Bruma, Vagante Corrompido, Sabujo de Ferro (catálogo
    inicial; ver Volume III, Parte VI). Serão expandidos/renomeados conforme o
    bestiário crescer.
- **Casos iniciais (PDF, 🔮 não implementados):** O Silêncio da Torre; A Luz no
  Poço; O Homem que Voltou; O Que Feodor Encontrou.

## Sistemas do MVP (estado)

| Sistema | Estado |
|---------|:------:|
| Login / Cadastro | ✅ |
| Personagem / Classes | ✅ |
| Movimento entre nós | ✅ |
| Combate por turnos | ✅ |
| Progressão (nível/XP/perícias) | ✅ |
| Exploração (buscar/coletar) | 🔮 |
| Inventário | 🔄 (leitura; ações 🔮) |
| Conhecimento / Documentos | 🔮 |
| Confiança de NPC / Diálogo | 🔮 (conflito de design a resolver — ver Volume IV) |

---

> Para o estado detalhado e o handoff completo do desenvolvimento, ver
> `.kiro/ESTADO_DO_PROJETO.md`.
