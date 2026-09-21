# Volume IV — Interface, Navegação e Sistemas de Mundo

> **Fonte de verdade viva do projeto.** Reflete o que o jogo **é e será**. O PDF
> (`docs/mists_of_krakovia_interface_gameplay_v2.pdf`, rev. v2.0) é a ideia
> inicial; vale o que está aqui quando o código diverge. 🔮 marca o que ainda não
> foi implementado.

---

## Parte I — Interface e Fluxo de Acesso

Design minimalista: fundo escuro com textura de névoa, paleta ferrugem e dourado.
Sem banners, sem ruído visual.

### Login
- Logo centralizado; tagline de uma linha ("O que está além da névoa é sua
  decisão descobrir.").
- Campos de e-mail e senha; botão **Entrar**. ✅ implementado.
- 🔮 **Entrar com Google (OAuth)** e 🔮 **Esqueci a senha** — planejados. Hoje só
  e-mail + senha.
- **Criar conta** ✅.

### Seleção de personagem
- Slots com nome, classe, nível e status (PV/estamina). Slots vazios: [+ Criar
  Personagem]; ocupados: [Jogar]. ✅
- Cada conta tem **5 slots**. ✅
- 🔮 **Excluir personagem** (com confirmação dupla) — planejado, ainda não
  implementado. 🔮 Slots extras via loja (conveniência, sem impacto em gameplay).

### Criação de personagem

**Implementado: 3 etapas** (Classe → Nome + Atributos → Confirmação).

1. **Classe** — 5 cards com nome, subtítulo e descrição narrativa; ao selecionar,
   mostra as perícias iniciais. Tom narrativo, sem números.
2. **Nome + Atributos** — nome até 20 caracteres (letras acentuadas, números,
   espaços, hífen/apóstrofo/ponto; proíbe barras, aspas e tags); único por conta.
   Os 6 atributos com 5 pontos para distribuir (+/-), nenhum acima de D+.
3. **Confirmação** — resumo e "Entrar no Mundo". Aviso: atributos e classe não
   mudam depois.

> **Diferença do PDF:** o planejamento previa **5 etapas**, incluindo uma etapa de
> distribuição de perícias e seleção de avatar. A criação foi **simplificada**: a
> etapa de perícias saiu (o personagem começa só com as 3 perícias da classe em
> nível 2 e recebe `1 + MG_INT` pontos de campo para gastar depois na página de
> Perícias in-game). 🔮 Seleção de avatar ainda não implementada.

---

## Parte II — Tela Principal do Jogo

Layout de **três colunas fixas**: painel esquerdo (personagem), central (mundo),
direito (interação). ✅ implementado.

### Painel esquerdo — Personagem
Navegação com botões que abrem subpáginas no centro. Barras de status: PV, Estamina
e XP/Nível. ✅

- **Personagem/Atributos** — 6 atributos base (escala F- a S+ e valor MP) e todos
  os derivados. Distribuição interativa dos pontos disponíveis. ✅
- **Perícias** — abas Campo e Combate; nível (0–10), atributo base, requisitos;
  pontos disponíveis; distribuição interativa. ✅
- **Habilidades** 🔮 — lista de habilidades de classe (passivas/ativas). Ainda não
  há página dedicada; as habilidades aparecem no painel de combate.
- **Inventário** ✅ leitura (grade de itens + slots de equipamento + peso/carga).
  🔮 Ações (Equipar/Usar/Descartar) ainda não implementadas.
- **Documentos** 🔮 — arquivo de textos por categoria; começa com 3 documentos
  comuns. Placeholder.
- **Missões** 🔮 — lista de ativas/concluídas, sem marcadores no mapa. Placeholder.
- **Produção** 🔮 — abas Coleta / Fabricação / Receitas / Histórico (ver Parte IV).

### Painel central — O Mundo
- **Imagem de ambiente** por local, com variações por hora e clima. ✅ (imagem base)
- **Caixa de narração dinâmica** por templates, variando com local, hora, clima e
  seed; atualiza quando algo muda. ✅

### Painel direito — Interação
- Seções: NPCs presentes, Saídas (com custo de estamina), Ações de campo. ✅
- **Ações de campo:** **Caçar** ✅ (inicia combate). 🔮 Explorar/Buscar/Coletar
  (desabilitados por ora). Em assentamentos: **Salvar progresso** ✅ (ponto de
  respawn).
- **Online:** jogadores presentes no nó (presença por heartbeat). ✅

---

## Parte III — Navegação, Mapas e Estamina

- Mundo dividido em **nós interconectados**. Navegação de nó em nó pelas saídas. ✅
- **Tipos de nó:** `settlement` (assentamento/zona segura, sem spawns, movimento
  interno grátis), `field` (campo: criaturas/recursos), `mist` (névoa: 🔮 regras de
  exposição), `passage` (transição), `secret` (oculto). ✅
- **Mapa do jogador:** só nós já visitados, ligados por rotas conhecidas —
  diagrama de conexões, não coordenadas. ✅ (descoberta por movimento)
- 🔮 **Tempo de viagem** por distância/AGI e cancelamento de viagem — não
  implementados (movimento é imediato, custa estamina).

### Estamina
Recurso fora do combate. Máximo = `100 + (MP_RES × 5)`. Movimento consome; hoje
não regenera automaticamente (🔮 regeneração planejada). Custos de referência:

| Ação | Custo | Observação |
|------|:-----:|------------|
| Viagem entre nós (campo) | 10–30 | Varia com a distância configurada |
| Viagem entre nós (névoa) | 15–40 | Névoa aumenta o custo em ~50% |
| Caça manual (por encontro) | 5 | 🔮 (hoje Caçar não cobra estamina) |
| 🔮 Caça automática (por hora) | 20 | Planejado |
| 🔮 Coleta específica | 8 | Planejado |
| 🔮 Busca geral | 12 | Planejado |
| 🔮 Avançar (novo nó) | 15 | Planejado |

> Penalidade de morte: −20 de estamina (ver Volume III, Parte VII).

---

## Parte IV — Produção, Coleta e Progressão por Uso 🔮 (planejado)

Sistema à parte das perícias, com **progressão por uso** (não por pontos). Nível
cresce com a prática. Ainda não implementado.

- **Escala:** 7 letras fechadas F→S (Iniciante → Lendário), sem +/-.
- **Categorias de produção:** Armaria (Brancas / Fogo e Dispositivos / Proteção),
  Alquimia, Medicina — cada uma com nível independente.
- **Categorias de coleta:** Mineração, Herbologia, Extrativismo, Fragmentação,
  Desmontagem.
- XP por ação escala com a complexidade; farmar item simples é ineficiente.

---

## Parte V — Sistema de Caça

- **Caça manual** ✅ (ação "Caçar"): inicia encontro imediato com criatura do nó
  (sorteio ponderado por `node_spawns`). Combate por turnos completo (Volume III).
  Hoje com 100% de encontro (será calibrado). 🔮 Encontros especiais (criaturas
  únicas, grupos) e influência da perícia Sobrevivência no drop.
- **Caça automática** 🔮 — configurar duração e simular encontros; usa só ataques
  base e passivas; interrompe se PV ≤ 20%. Planejado.
- **Encontro ao mover** ✅ — atrás da flag `ENCOUNTERS_ON_MOVE` (default off); rola
  a `encounter_rate` do nó de destino (ver Volume III, Parte VI).

---

## Parte VI — NPCs e Sistema de Diálogo 🔮 (planejado)

> **Conflito de design a resolver:** o schema atual do banco tem árvore de diálogo
> (`dialogue_trees/nodes/options`), mas este documento pede motor de
> palavras-chave + confiança. Decidir a abordagem antes de implementar.

- **Motor de reconhecimento por palavras-chave** (mais leve que LLM, mais
  expressivo que REGEX): normalização (minúsculas, correção por distância de
  Levenshtein ≤ 2), detecção de intenção (SAUDAÇÃO, MISSÃO, COMÉRCIO, KRAKOVIA,
  NÉVOA, FACÇÃO, DESPEDIDA, DESCONHECIDO), e resposta com 3–5 variações.
- **Confiança e Reputação:** NPC tem confiança 0–100 (por reputação de facção,
  missões, escolhas). Nunca exibida como número — comunicada pelo tom. Confiança
  alta abre fragmentos narrativos e missões exclusivas.

---

## Parte VII — Sistemas Multiplayer 🔮 (parcial)

- **Presença online** por nó ✅ (heartbeat).
- 🔮 **Chat** (canais Global/Regional/Grupo/Direto) — planejado.
- 🔮 **Grupo** (até 5 jogadores). O banco já está preparado para combate
  multi-combatente. Bônus de XP planejados:

| Membros | Bônus | | Classes distintas | Bônus |
|:-------:|:-----:|-|:-----------------:|:-----:|
| 2 | +10% | | 2 | +10% |
| 3 | +20% | | 3 | +25% |
| 4 | +30% | | 4 | +45% |
| 5 | +40% | | 5 | +70% |

  Os dois bônus somam (5 jogadores + 5 classes = +110%). Aplicado ao XP de cada
  membro (não dividido). Drop individual por jogador (sem need/greed).
- 🔮 **Comércio** entre jogadores (direto e mercado regional com taxa de 5%).

---

## Parte VIII — Monetização 🔮 (planejado)

**Princípio absoluto: nada pago dá vantagem de gameplay.** Só conveniência,
expressão e benefícios coletivos.

- **Pode vender:** slots de personagem extras, renomear personagem, avatares
  cosméticos, temas de interface, e **doações coletivas** (booster de XP de
  servidor e item de restauração de estamina — via termômetro público, benefício
  para todos, com preço progressivo por ativação).
- **Nunca pode vender:** XP/boosters individuais, equipamento com stats superiores
  ao obtível em jogo, consumíveis de combate exclusivos, acesso antecipado, moeda
  de jogo, reset de atributos/perícias fora do jogo, expansão de inventário, slots
  de caça automática, ou qualquer item de combate não obtível por gameplay.

---

## Apêndice — Diferenças em relação ao PDF

- Criação: **5 etapas → 3 etapas** (etapa de perícias removida; avatar 🔮).
- **Excluir personagem:** previsto no PDF, ainda 🔮 não implementado.
- **Regeneração de estamina:** o PDF define regen (1/min fora, 0.5/min na névoa,
  5/min descansando); hoje a estamina só decresce. 🔮
- **Ações de campo:** só "Caçar" está ativa; Buscar/Coletar/Explorar 🔮.
- **NPC/diálogo:** conflito schema (árvore) × doc (palavras-chave) a resolver.
