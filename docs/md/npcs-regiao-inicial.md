# NPCs — Região Inicial (fonte de verdade do conteúdo de diálogo)

> Conteúdo pronto para virar seed (`npc_dialogue`, locale `pt`). Sistema: motor de
> palavras-chave + intenção (ver `.kiro/specs/dialogos/`). 2 NPCs por assentamento
> (8 no total). Nenhum é de comércio nem de quest por ora — as intenções COMERCIO e
> MISSAO respondem só em texto ("ainda não"). Confiança (`min_confidence`) = 0 em
> tudo por ora.

Intenções cobertas por NPC: SAUDACAO, DESPEDIDA, SOBRE_NPC, NEVOA, KRAKOVIA,
FACCAO, RUMORES, MISSAO, COMERCIO, OBSCENO, DESCONHECIDO. Cada uma com 3–5
variações (o motor sorteia). Abaixo, 2–3 exemplos por intenção; o seed traz o
conjunto completo.

---

## Ironfall — Distrito Central (cidade grande)

### Maren Vosk (já existe) — informante cansada
Mulher de meia-idade, ex-mensageira, conhece cada beco de Ironfall. Fala seco,
prática, sem paciência para rodeios.
- **SAUDACAO:** "Vosk. O que quer?" / "Fala logo, tenho ouvidos ocupados." / "Você de novo."
- **SOBRE_NPC:** "Maren Vosk. Levo e trago recados. O que chega aos meus ouvidos, fica." 
- **NEVOA:** "A névoa? Fica de costas pra ela, como todo mundo com juízo. Só os Vagantes olham de frente."
- **KRAKOVIA:** "A cidade grande, lá dentro. Meu avô dizia que era bonita. Meu avô também mentia."
- **FACCAO:** "Legião cobra 'segurança'. Conclave brinca de deus. A Igreja pelo menos enterra os mortos."
- **RUMORES:** "Dizem que sumiu gente no Poço dos Ratos. Dizem muita coisa." / "Ouvi que o Ferro-Velho anda barulhento à noite."
- **MISSAO:** "Trabalho? Ainda não tenho nada pra você. Volte." 
- **COMERCIO:** "Não vendo nada além de silêncio, e esse sai caro."
- **OBSCENO:** "Cuida da língua, criança. Isto aqui não é taverna de porto."
- **DESPEDIDA:** "Vai. E olha por onde pisa." / "Some daqui."
- **DESCONHECIDO:** "Não sei do que você fala. Seja claro."

### Tomas Grieg — ferreiro de Ironfall
Homem enorme, braços marcados de faísca, voz grave e calorosa. Orgulhoso do ofício,
desconfia da névoa e de quem a corteja.
- **SAUDACAO:** "Ah, um rosto novo na forja! Entre, entre." / "Bom te ver de pé."
- **SOBRE_NPC:** "Tomas Grieg. Bato ferro desde menino. Se é de aço, eu conserto."
- **NEVOA:** "Aquilo comeu meu irmão. Não fale dela perto da minha bigorna."
- **KRAKOVIA:** "Dizem que os ferreiros de Krakovia forjavam com o próprio Æther. Bobagem, imagino."
- **FACCAO:** "A Legião compra minhas lâminas e nunca paga direito. A Fumaça Negra... dessas eu fujo."
- **RUMORES:** "Anda faltando metal bom. Os autômatos do Ferro-Velho levam a melhor sucata."
- **MISSAO:** "Encomenda? Ainda não. Quando eu precisar de mãos, você saberá."
- **COMERCIO:** "Minha forja ainda não está aberta a estranhos. Volte outro dia."
- **OBSCENO:** "Eu vou lavar essa sua boca com sabão de cinza, moleque!"
- **DESPEDIDA:** "Que o ferro te guarde." / "Vá com cuidado."
- **DESCONHECIDO:** "Hã? Fala como gente, não te entendi."

---

## Rostok (leste) — tratadores e sucateiros

### Iva Renko — tratadora de bestas
Jovem calejada, cheira a couro e bicho. Direta, gosta mais de animais que de gente.
- **SAUDACAO:** "Cuidado onde pisa, tem bicho solto." / "Fala baixo, eles se assustam."
- **SOBRE_NPC:** "Iva. Cuido dos bichos que sobram — os que a névoa não estragou de vez."
- **NEVOA:** "Os animais sentem antes da gente. Quando eles fogem pro sul, eu fujo junto."
- **KRAKOVIA:** "Nunca fui. Nem quero. O que é meu está aqui, com quatro patas."
- **FACCAO:** "Facção nenhuma cuida de bicho. Só eu."
- **RUMORES:** "Os cães da borda estão descendo mais. Algo lá em cima os está empurrando."
- **MISSAO:** "Ajuda? Talvez um dia, se um bicho meu sumir. Hoje não."
- **COMERCIO:** "Não vendo meus bichos. Nem por ouro de Krakovia."
- **OBSCENO:** "Fala assim de novo e eu solto os cães em você."
- **DESPEDIDA:** "Vai, e não assusta a criação." / "Até."
- **DESCONHECIDO:** "Não entendi. Repete devagar, como se fala com um filhote."

### Petrov Sluka — sucateiro velho
Velho magro, um olho leitoso, dedos manchados de óleo. Fala em rodeios, adora uma
história e uma peça enferrujada.
- **SAUDACAO:** "Ora, ora... procurando tesouro no lixo, é?" / "Chega mais, jovem."
- **SOBRE_NPC:** "Sluka. Compro o que ninguém quer e vendo o que todos precisam. Um dia."
- **NEVOA:** "Já entrei na primeira camada, sabia? Trouxe isto." (mostra um coto de dedo) "Não vale a pena."
- **KRAKOVIA:** "As melhores peças vêm de lá. Pré-Cataclisma. Mas quem traz, não volta inteiro."
- **FACCAO:** "O Conclave paga bem por núcleo de autômato. Se achar um, traga a mim primeiro, hein?"
- **RUMORES:** "Dizem que há uma torre escondida no Ferro-Velho. Cheia de aço bom. E de algo mais."
- **MISSAO:** "Serviço? Ainda não, mas fica de olho. Sempre precisa de quem cave na sucata."
- **COMERCIO:** "Minha banca ainda não abriu pra você. Paciência, tudo tem seu tempo."
- **OBSCENO:** "Hehe, essa boca! Guarda pra névoa, ela merece mais palavrão que eu."
- **DESPEDIDA:** "Volte, e traga sucata." / "Vai com Deus, ou com o que restou dele."
- **DESCONHECIDO:** "Meu ouvido já era. Fala mais alto e mais claro."

---

## Vila Cinzal (oeste) — vila agrícola de cinza

### Irmã Aldona — clériga da Igreja do Véu Prateado
Mulher serena de hábito cinza, mãos gastas de cuidar de doentes. Fala com calma e
compaixão, mas sem ilusões.
- **SAUDACAO:** "Que o Véu te cubra, viajante." / "Paz. Precisa de descanso?"
- **SOBRE_NPC:** "Sou a Irmã Aldona. Cuido dos que a névoa tocou e dos que ela levará."
- **NEVOA:** "Não é castigo, apesar do que dizem no púlpito. É uma ferida no mundo. Rezo por quem entra nela."
- **KRAKOVIA:** "A cidade caiu porque tocou no que não devia. É a única prece que sei ser verdadeira."
- **FACCAO:** "A Igreja não escolhe lados. Cuidamos de legionário e de cultista igual — o sangue é o mesmo."
- **RUMORES:** "Chegam mais doentes da borda a cada lua. A Vila Cinzal não vai aguentar tanto."
- **MISSAO:** "Ajuda? O mundo sempre precisa. Mas hoje não tenho tarefa digna de você."
- **COMERCIO:** "Não vendo a fé, filho. E remédio, ainda não tenho de sobra pra trocar."
- **OBSCENO:** "Ah... o Véu perdoa até essa boca. Mas por favor, poupe meus ouvidos."
- **DESPEDIDA:** "Vá em paz." / "Que encontre a saída da névoa, e de si mesmo."
- **DESCONHECIDO:** "Perdoe, não compreendi. Fale com o coração, devagar."

### Old Bohdan — lavrador de cinza
Velho lavrador teimoso, rosto rachado de sol e cinza. Resmungão, mas honesto.
- **SAUDACAO:** "Hmpf. Outro forasteiro pisando na minha plantação." / "Dia."
- **SOBRE_NPC:** "Bohdan. Planto na cinza o que a cinza deixa. Não é muito, mas alimenta."
- **NEVOA:** "Vem do norte e mata a plantação de leste pra oeste, ano após ano. Logo não sobra terra."
- **KRAKOVIA:** "Cidade grande, comida farta, dizem. Aqui a gente come raiz e agradece."
- **FACCAO:** "Legião, Conclave, tanto faz. Nenhum deles nunca segurou uma enxada."
- **RUMORES:** "O Bosque Retorcido está mais fundo esse ano. E os bichos de lá, mais bravos."
- **MISSAO:** "Trabalho eu tenho de sobra, mas não pra aventureiro. Volte na colheita, talvez."
- **COMERCIO:** "Vender? Mal tenho pra mim. Quem sabe depois da colheita."
- **OBSCENO:** "Na minha época levava tapa na orelha por falar assim. Respeito, moleque!"
- **DESPEDIDA:** "Vai, e não pisa nas mudas." / "Hmpf. Até."
- **DESCONHECIDO:** "Fala direito, não sou adivinho."

---

## Posto Belograd (norte, borda da névoa)

### Osip Drenkov — guarda veterano (Legião dos Exilados)
Veterano de rosto duro, cicatriz na testa, olhar sempre no horizonte norte. Fala em
ordens curtas. (É o guarda citado no Volume II.)
- **SAUDACAO:** "Alto lá. Identifique-se... ah, um Vagante. Passe." / "Posto Belograd. Não faça besteira."
- **SOBRE_NPC:** "Sargento Drenkov, Legião. Guardo esta porta pra que idiotas não entrem na névoa e morram."
- **NEVOA:** "Máscara grau um, couro tratado, e um motivo pra voltar. Sem os três, você é problema meu."
- **KRAKOVIA:** "Meu juramento foi à coroa de Krakovia. A coroa se foi. O juramento, não."
- **FACCAO:** "A Legião mantém a ordem que sobrou. Não pedimos amor, pedimos disciplina."
- **RUMORES:** "A Contenção registrou movimento estranho na fenda da trilha. Não é da minha alçada. Ainda."
- **MISSAO:** "Ordens pra você? Ainda não. Quando a Legião precisar, você será chamado."
- **COMERCIO:** "Aqui não é mercado. Suprimento é da quartelagem, e não é pra você."
- **OBSCENO:** "Vinte flexões por essa boca, recruta! ...Ah, você não é meu. Suma."
- **DESPEDIDA:** "Dispensado." / "Volte inteiro, se voltar."
- **DESCONHECIDO:** "Não entendi a ordem. Repita, claro e curto."

### Lena Marchuk — batedora da borda
Jovem batedora nervosa, olhos fundos de quem não dorme perto da névoa. Fala rápido,
em voz baixa, olhando por cima do ombro.
- **SAUDACAO:** "Psiu. Fala baixo. A névoa escuta... ou eu que estou louca." / "Você é novo aqui."
- **SOBRE_NPC:** "Lena. Batedora. Eu chego mais perto da névoa do que qualquer um são deveria."
- **NEVOA:** "Ela não se move. Fica exatamente onde quer ficar. Como se soubesse. Isso me apavora."
- **KRAKOVIA:** "Uma vez, num dia claro, jurei ter visto uma torre lá dentro. Ninguém acreditou."
- **FACCAO:** "O Drenkov confia na Legião. Eu não confio em ninguém que dá as costas pra névoa."
- **RUMORES:** "Tem uma fenda na Trilha da Contenção. Algo lá dentro me observou. Eu corri."
- **MISSAO:** "Preciso de ajuda, sim... mas ainda não sei pedir. Volte, por favor."
- **COMERCIO:** "Não tenho nada pra vender além de más notícias."
- **OBSCENO:** "Shh! Quer que a névoa te ouça falando assim? ...brincadeira. Meio."
- **DESPEDIDA:** "Vai. E não olha muito tempo pro norte." / "Cuidado lá fora."
- **DESCONHECIDO:** "Não... não entendi. Repete, mas baixo."

---

## Notas de seed
- Cada NPC entra em `npc_dialogue` com uma linha por intenção (locale `pt`,
  `min_confidence` 0, `variants` = array das falas acima — o seed completa 3–5).
- Ironfall reaproveita **Maren Vosk** (por nome+nó); os demais 7 são criados.
- Ligação NPC↔assentamento por `description_key` do nó (seed resolve o id).
- `is_quest_giver` = false em todos por ora.
- Ganchos de RUMORES apontam para nós reais (Poço dos Ratos, Ferro-Velho/Torre,
  Bosque, fenda da Trilha) — dão pistas sutis das passagens secretas e bosses.
