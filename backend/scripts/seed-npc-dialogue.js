// Respostas de diálogo dos NPCs — Spec 4, Sub-parte A. locale 'pt'.
// Fonte: docs/md/npcs-regiao-inicial.md. REST-only, idempotente (limpa e recria as
// linhas pt de cada NPC deste conjunto). min_confidence = 0 por ora.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-npc-dialogue.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// name -> { intent -> [variações] }.
const D = {
  'Maren Vosk': {
    SAUDACAO: ['Vosk. O que quer?', 'Fala logo, tenho ouvidos ocupados.', 'Você de novo.'],
    SOBRE_NPC: ['Maren Vosk. Levo e trago recados. O que chega aos meus ouvidos, fica.', 'Sou os ouvidos de Ironfall. Nada mais.'],
    NEVOA: ['A névoa? Fica de costas pra ela, como todo mundo com juízo. Só os Vagantes olham de frente.', 'Não gosto de falar dela. Dá azar.'],
    KRAKOVIA: ['A cidade grande, lá dentro. Meu avô dizia que era bonita. Meu avô também mentia.', 'Krakovia é um túmulo com muros. Deixa quieto.'],
    FACCAO: ["Legião cobra 'segurança'. Conclave brinca de deus. A Igreja pelo menos enterra os mortos.", 'Confio em quem paga e cala. O resto é barulho.'],
    RUMORES: ['Dizem que sumiu gente no Poço dos Ratos. Dizem muita coisa.', 'Ouvi que o Ferro-Velho anda barulhento à noite.', 'Anda um cheiro ruim vindo do norte. Mais que o de sempre.'],
    MISSAO: ['Trabalho? Ainda não tenho nada pra você. Volte.', 'Sem serviço hoje. Aparece outra hora.'],
    COMERCIO: ['Não vendo nada além de silêncio, e esse sai caro.', 'Mercadoria? Procura o Grieg, não a mim.'],
    OBSCENO: ['Cuida da língua, criança. Isto aqui não é taverna de porto.', 'Fala assim de novo e eu paro de te ouvir.'],
    DESPEDIDA: ['Vai. E olha por onde pisa.', 'Some daqui.'],
    DESCONHECIDO: ['Não sei do que você fala. Seja claro.', 'Fala direito ou não fala.'],
  },
  'Tomas Grieg': {
    SAUDACAO: ['Ah, um rosto novo na forja! Entre, entre.', 'Bom te ver de pé.', 'Salve! O calor aqui é honesto, diferente do lá fora.'],
    SOBRE_NPC: ['Tomas Grieg. Bato ferro desde menino. Se é de aço, eu conserto.', 'Ferreiro, filho de ferreiro. É o que sou.'],
    NEVOA: ['Aquilo comeu meu irmão. Não fale dela perto da minha bigorna.', 'Névoa não se forja, não se dobra. Só se foge.'],
    KRAKOVIA: ['Dizem que os ferreiros de Krakovia forjavam com o próprio Æther. Bobagem, imagino.', 'A cidade tinha aço melhor que o meu. Tinha.'],
    FACCAO: ['A Legião compra minhas lâminas e nunca paga direito. A Fumaça Negra... dessas eu fujo.', 'Conclave? Gente que estuda o que devia queimar.'],
    RUMORES: ['Anda faltando metal bom. Os autômatos do Ferro-Velho levam a melhor sucata.', 'Dizem que há uma torre de aço escondida por lá. Aço que eu bem queria.'],
    MISSAO: ['Encomenda? Ainda não. Quando eu precisar de mãos, você saberá.', 'Sem trabalho pra você hoje, Vagante.'],
    COMERCIO: ['Minha forja ainda não está aberta a estranhos. Volte outro dia.', 'Ainda não vendo nada. Paciência.'],
    OBSCENO: ['Eu vou lavar essa sua boca com sabão de cinza, moleque!', 'Na minha forja se fala com respeito, ou não se fala!'],
    DESPEDIDA: ['Que o ferro te guarde.', 'Vá com cuidado.'],
    DESCONHECIDO: ['Hã? Fala como gente, não te entendi.', 'Não peguei. Repete.'],
  },
  'Iva Renko': {
    SAUDACAO: ['Cuidado onde pisa, tem bicho solto.', 'Fala baixo, eles se assustam.', 'Você. Não faz movimento brusco.'],
    SOBRE_NPC: ['Iva. Cuido dos bichos que sobram — os que a névoa não estragou de vez.', 'Sou tratadora. Prefiro focinho a gente.'],
    NEVOA: ['Os animais sentem antes da gente. Quando eles fogem pro sul, eu fujo junto.', 'A névoa deixa os bichos errados. Já vi coisa que não devia existir.'],
    KRAKOVIA: ['Nunca fui. Nem quero. O que é meu está aqui, com quatro patas.', 'Cidade grande não tem lugar pra bicho. Nem pra mim.'],
    FACCAO: ['Facção nenhuma cuida de bicho. Só eu.', 'Não me meto nessas brigas de gente.'],
    RUMORES: ['Os cães da borda estão descendo mais. Algo lá em cima os está empurrando.', 'Um javali voltou do norte com três olhos. Não durou.'],
    MISSAO: ['Ajuda? Talvez um dia, se um bicho meu sumir. Hoje não.', 'Nada pra você agora.'],
    COMERCIO: ['Não vendo meus bichos. Nem por ouro de Krakovia.', 'Comércio não é comigo.'],
    OBSCENO: ['Fala assim de novo e eu solto os cães em você.', 'Grosseria assusta a criação. Para.'],
    DESPEDIDA: ['Vai, e não assusta a criação.', 'Até.'],
    DESCONHECIDO: ['Não entendi. Repete devagar, como se fala com um filhote.', 'Hã? De novo.'],
  },
  'Petrov Sluka': {
    SAUDACAO: ['Ora, ora... procurando tesouro no lixo, é?', 'Chega mais, jovem.', 'Ah, um cliente! Ou quase.'],
    SOBRE_NPC: ['Sluka. Compro o que ninguém quer e vendo o que todos precisam. Um dia.', 'Sou o velho da sucata. Tudo tem valor, se você souber olhar.'],
    NEVOA: ['Já entrei na primeira camada, sabia? Trouxe isto — um coto de dedo. Não vale a pena.', 'A névoa cobra pedágio em carne. Eu paguei o meu.'],
    KRAKOVIA: ['As melhores peças vêm de lá. Pré-Cataclisma. Mas quem traz, não volta inteiro.', 'Krakovia é uma mina de tesouros guardada por pesadelos.'],
    FACCAO: ['O Conclave paga bem por núcleo de autômato. Se achar um, traga a mim primeiro, hein?', 'Karamazov compra segredo. Eu compro ferro. Cada um com seu lixo.'],
    RUMORES: ['Dizem que há uma torre escondida no Ferro-Velho. Cheia de aço bom. E de algo mais.', 'Ouvi de uma fenda na trilha do norte. Ninguém que entrou voltou pra contar.'],
    MISSAO: ['Serviço? Ainda não, mas fica de olho. Sempre precisa de quem cave na sucata.', 'Hoje não tenho tarefa. Volte.'],
    COMERCIO: ['Minha banca ainda não abriu pra você. Paciência, tudo tem seu tempo.', 'Ainda não estou vendendo. Mas anota meu nome.'],
    OBSCENO: ['Hehe, essa boca! Guarda pra névoa, ela merece mais palavrão que eu.', 'Ho ho, que língua! Já ouvi pior, mas comporta-se.'],
    DESPEDIDA: ['Volte, e traga sucata.', 'Vai com Deus, ou com o que restou dele.'],
    DESCONHECIDO: ['Meu ouvido já era. Fala mais alto e mais claro.', 'Hã? Não captei, jovem.'],
  },
  'Irmã Aldona': {
    SAUDACAO: ['Que o Véu te cubra, viajante.', 'Paz. Precisa de descanso?', 'Bem-vindo. Aqui há abrigo, se precisar.'],
    SOBRE_NPC: ['Sou a Irmã Aldona. Cuido dos que a névoa tocou e dos que ela levará.', 'Serva do Véu Prateado. Minhas mãos são da Igreja.'],
    NEVOA: ['Não é castigo, apesar do que dizem no púlpito. É uma ferida no mundo. Rezo por quem entra nela.', 'Vi o que ela faz com a carne e a mente. Reze, se souber como.'],
    KRAKOVIA: ['A cidade caiu porque tocou no que não devia. É a única prece que sei ser verdadeira.', 'Krakovia é a lição que o mundo se recusa a aprender.'],
    FACCAO: ['A Igreja não escolhe lados. Cuidamos de legionário e de cultista igual — o sangue é o mesmo.', 'A Fumaça Negra chama a mutação de bênção. Eu rezo por eles também.'],
    RUMORES: ['Chegam mais doentes da borda a cada lua. A Vila Cinzal não vai aguentar tanto.', 'Um lavrador jurou ter ouvido sinos numa gruta sem sinos. Delírio da névoa, talvez.'],
    MISSAO: ['Ajuda? O mundo sempre precisa. Mas hoje não tenho tarefa digna de você.', 'Ainda não, filho. Guarde suas forças.'],
    COMERCIO: ['Não vendo a fé, filho. E remédio, ainda não tenho de sobra pra trocar.', 'Aqui não se compra nada além de um momento de paz.'],
    OBSCENO: ['Ah... o Véu perdoa até essa boca. Mas por favor, poupe meus ouvidos.', 'Que linguajar. Vou fingir que foi a névoa falando por você.'],
    DESPEDIDA: ['Vá em paz.', 'Que encontre a saída da névoa, e de si mesmo.'],
    DESCONHECIDO: ['Perdoe, não compreendi. Fale com o coração, devagar.', 'Não entendi, filho. Repita.'],
  },
  'Old Bohdan': {
    SAUDACAO: ['Hmpf. Outro forasteiro pisando na minha plantação.', 'Dia.', 'Que quer? Estou ocupado com a cinza.'],
    SOBRE_NPC: ['Bohdan. Planto na cinza o que a cinza deixa. Não é muito, mas alimenta.', 'Sou lavrador. Fui, sou e morro sendo.'],
    NEVOA: ['Vem do norte e mata a plantação de leste pra oeste, ano após ano. Logo não sobra terra.', 'A névoa é ladra paciente. Rouba um palmo por estação.'],
    KRAKOVIA: ['Cidade grande, comida farta, dizem. Aqui a gente come raiz e agradece.', 'Nunca vi Krakovia. Nem a terra dela deve prestar mais.'],
    FACCAO: ['Legião, Conclave, tanto faz. Nenhum deles nunca segurou uma enxada.', 'Facção não planta, não colhe. Pra que serve, então?'],
    RUMORES: ['O Bosque Retorcido está mais fundo esse ano. E os bichos de lá, mais bravos.', 'A Irmã anda recebendo doente demais. Coisa feia vindo da borda.'],
    MISSAO: ['Trabalho eu tenho de sobra, mas não pra aventureiro. Volte na colheita, talvez.', 'Nada pra você. Vai incomodar outro.'],
    COMERCIO: ['Vender? Mal tenho pra mim. Quem sabe depois da colheita.', 'Não sobra nada pra troca. Ainda.'],
    OBSCENO: ['Na minha época levava tapa na orelha por falar assim. Respeito, moleque!', 'Boca suja não aduba nada. Some.'],
    DESPEDIDA: ['Vai, e não pisa nas mudas.', 'Hmpf. Até.'],
    DESCONHECIDO: ['Fala direito, não sou adivinho.', 'Hã? Não entendi essa.'],
  },
  'Osip Drenkov': {
    SAUDACAO: ['Alto lá. Identifique-se... ah, um Vagante. Passe.', 'Posto Belograd. Não faça besteira.', 'Recruta? Não. Vagante. Fale.'],
    SOBRE_NPC: ['Sargento Drenkov, Legião. Guardo esta porta pra que idiotas não entrem na névoa e morram.', 'Sou a última ordem de pé neste posto.'],
    NEVOA: ['Máscara grau um, couro tratado, e um motivo pra voltar. Sem os três, você é problema meu.', 'Ninguém passa deste posto sem meu aval. E eu não dou aval fácil.'],
    KRAKOVIA: ['Meu juramento foi à coroa de Krakovia. A coroa se foi. O juramento, não.', 'Servi à cidade. Ainda sirvo, do lado de fora do túmulo dela.'],
    FACCAO: ['A Legião mantém a ordem que sobrou. Não pedimos amor, pedimos disciplina.', 'Enquanto houver um legionário de pé, há lei nesta borda.'],
    RUMORES: ['A Contenção registrou movimento estranho na fenda da trilha. Não é da minha alçada. Ainda.', 'Belograd é o fim da linha. Depois daqui, só a névoa e quem é tolo o bastante pra entrar.'],
    MISSAO: ['Ordens pra você? Ainda não. Quando a Legião precisar, você será chamado.', 'Sem missão. Mantenha-se pronto.'],
    COMERCIO: ['Aqui não é mercado. Suprimento é da quartelagem, e não é pra você.', 'Não se compra nada num posto de guarda.'],
    OBSCENO: ['Vinte flexões por essa boca, recruta! ...Ah, você não é meu. Suma.', 'Guarde esse linguajar pro inimigo, se tiver coragem.'],
    DESPEDIDA: ['Dispensado.', 'Volte inteiro, se voltar.'],
    DESCONHECIDO: ['Não entendi a ordem. Repita, claro e curto.', 'Fale como soldado: direto.'],
  },
  'Lena Marchuk': {
    SAUDACAO: ['Psiu. Fala baixo. A névoa escuta... ou eu que estou louca.', 'Você é novo aqui.', 'Chega perto, mas não faz barulho.'],
    SOBRE_NPC: ['Lena. Batedora. Eu chego mais perto da névoa do que qualquer um são deveria.', 'Sou os olhos que o Drenkov manda pra frente. E eu vejo demais.'],
    NEVOA: ['Ela não se move. Fica exatamente onde quer ficar. Como se soubesse. Isso me apavora.', 'Às vezes juro que ela respira. Ninguém acredita em mim.'],
    KRAKOVIA: ['Uma vez, num dia claro, jurei ter visto uma torre lá dentro. Ninguém acreditou.', 'Tem algo vivo em Krakovia. Eu senti. Não pergunte como.'],
    FACCAO: ['O Drenkov confia na Legião. Eu não confio em ninguém que dá as costas pra névoa.', 'Facções brigam por terra. Eu só quero sobreviver à próxima ronda.'],
    RUMORES: ['Tem uma fenda na Trilha da Contenção. Algo lá dentro me observou. Eu corri.', 'Os cães da borda estão inquietos. Eles sabem de algo que a gente não sabe.'],
    MISSAO: ['Preciso de ajuda, sim... mas ainda não sei pedir. Volte, por favor.', 'Ainda não. Preciso ter certeza antes de te arrastar pra isso.'],
    COMERCIO: ['Não tenho nada pra vender além de más notícias.', 'Comércio? Aqui? Você é otimista.'],
    OBSCENO: ['Shh! Quer que a névoa te ouça falando assim? ...brincadeira. Meio.', 'Baixa a voz e o palavrão, pelo amor.'],
    DESPEDIDA: ['Vai. E não olha muito tempo pro norte.', 'Cuidado lá fora.'],
    DESCONHECIDO: ['Não... não entendi. Repete, mas baixo.', 'Hã? Fala de novo, devagar.'],
  },
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY.'); process.exit(1);
  }
  // Resolve os NPCs por nome (os do nosso conjunto).
  const names = Object.keys(D);
  const { data: npcs } = await supabase.from('npcs').select('id, name').in('name', names);
  const idByName = {};
  for (const n of npcs || []) idByName[n.name] = n.id;

  let rows = 0;
  for (const [name, intents] of Object.entries(D)) {
    const npcId = idByName[name];
    if (!npcId) { console.warn(`NPC nao encontrado (rode seed-npcs.js antes): ${name}`); continue; }
    // Limpa as linhas pt deste NPC (idempotência) e recria.
    await supabase.from('npc_dialogue').delete().eq('npc_id', npcId).eq('locale', 'pt');
    const toInsert = Object.entries(intents).map(([intent, variants], i) => ({
      npc_id: npcId, locale: 'pt', intent, variants, min_confidence: 0, sort_order: i,
    }));
    const { error } = await supabase.from('npc_dialogue').insert(toInsert);
    if (error) { console.error(`Erro em ${name}:`, error.message); process.exit(1); }
    rows += toInsert.length;
    console.log(`${name}: ${toInsert.length} intencoes.`);
  }
  console.log(`\nTotal de linhas de dialogo: ${rows}.`);
}
main();
