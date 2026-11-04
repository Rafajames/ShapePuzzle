# Shape Puzzle 🧩

Quebra-cabeça lógico: encaixe todas as peças no tabuleiro até preencher tudo. Roda direto no navegador (computador e celular), com música, campeonatos, acessibilidade e três idiomas. Feito por [Rafajames](https://github.com/Rafajames).

## 🌐 Jogar online

**https://rafajames.github.io/ShapePuzzle/**

Versão web em um único `index.html` (sem instalar nada), que roda no computador e no celular:

- **50 fases** com dificuldade crescente: as 30 primeiras em 5×5; da 31 em diante o tabuleiro cresce (6×6 e 7×7) e as peças vão entrando conforme você encaixa (sempre pelo menos 5 visíveis, a não ser que você escolha menos). Todas as fases novas têm solução única.
- **Fase do dia**: um desafio novo por dia, igual para todo mundo, com sequência de dias seguidos.
- **Peças por vez**: nas primeiras 10 fases aparecem 6 peças; depois, no mínimo 5 (o jogo nunca reduz sozinho para menos, para quem só quer relaxar). Quem quiser mais desafio escolhe menos no menu. Ao encaixar uma, a seguinte entra.
- **No celular**: dois toques giram a peça 90° e deslizar o dedo espelha. No computador ficam os botões e as teclas R e T.
- **Dica**: mostra onde vai uma peça. Partidas com dica não valem recorde.
- **Tempo, jogadas e recorde** por fase.
- **Música gerada por código** (Web Audio API) em 3 climas — Calma, Animada e Noturna — que mudam sozinhos a cada 10 fases ou ficam fixos à sua escolha.
- **Compartilhar**: o jogo, o seu resultado e as fases que você criar, por link (sem enviar arquivo).
- **Campeonato sem internet (QR code)**: em *Campeonatos → Campeonato sem internet*, você dá um nome, escreve os jogadores (até 12, contando com você) e escolhe as fases (até 8: do jogo ou sorteadas, de fácil a difícil). O jogo gera um QR code/link para cada pessoa; ao abrir, ela já entra como ela mesma. Cada um joga no seu tempo, sem internet e sem dicas (conta a primeira vez que termina cada fase). No fim, cada um mostra o QR/link de resultado, que é juntado no aparelho de quem organiza (ou de qualquer um): ranking pela soma dos tempos, estatísticas por fase e ranking final para compartilhar. Tudo viaja dentro do link — nada vai para servidor. Limites: os resultados são de confiança (a soma de verificação só percebe código cortado ou estragado) e o jogo precisa ter sido aberto uma vez com internet para funcionar sem ela.
- **Estatísticas de cada participante**: no ranking de qualquer campeonato (online ou sem internet), toque no nome para ver tempo total, jogadas, tempo médio e o desempenho fase a fase (posição em cada fase e melhor tempo).
- **Campeonatos com ranking**: crie um desafio com as fases que quiser, defina o número de pessoas e o prazo e mande o link; cada participante entra só com o nome e vê a sua posição no ranking. O organizador cria uma senha na primeira vez e pode editar (antes de alguém entrar) ou excluir o campeonato. Usa um banco gratuito do Firebase — veja [CAMPEONATOS.md](CAMPEONATOS.md).
- **Instalar como app** e jogar offline (PWA).
- **Editor de fases** com exportação/importação `.txt` no mesmo formato da [versão Java original](java-original/README.md) (o editor cria fases 5×5).

## 🎮 Como jogar

- **Arrastar e soltar** as peças da lista para o tabuleiro (ou tocar na peça e depois na casa).
- **Girar**: tecla `R` / botão Girar (no celular, dois toques). **Espelhar**: `T` / botão Espelhar (no celular, deslizar o dedo).
- **Tirar uma peça** já colocada: clique/toque nela (ou passe o mouse e aperte `E`). **Desfazer**: `Z`.
- Preencha o tabuleiro inteiro para vencer; as cores guiam onde cada peça vai.

## 📂 Estrutura do repositório

| Pasta/arquivo | O que é |
|---|---|
| `index.html` | O jogo inteiro num arquivo só (é o que o GitHub Pages publica). **É gerado** a partir de `src/`: não edite à mão |
| `src/` | Onde o jogo é editado, em partes: `css/` (estilos), `js/` (um arquivo por assunto: fases, áudio, jogo, infinito, backup, campeonato…), `idiomas/` (inglês e espanhol), `pagina.html` (a estrutura da página) |
| `build.js` | Junta `src/` e gera o `index.html` (`node build.js`) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Instalar como app e jogar offline |
| `firebase-rules.json`, `CAMPEONATOS.md` | Regras e guia do banco dos campeonatos |
| `tests/` | Testes automáticos (rodam no GitHub a cada publicação) |
| `fases-web/` | Fases 31–50 em `.txt` (cópia de referência; já estão no `index.html`) |
| `java-original/` | Primeira versão em Java Swing — não é usada pelo jogo web ([veja o README dela](java-original/README.md)) |
| `MELHORIAS.md` | Lista de ideias e o que já foi feito |

## Como editar o jogo

1. Edite os arquivos de `src/` (por exemplo, `src/js/backup.js` para mexer no backup, `src/css/telas.css` para os painéis).
2. Rode `node build.js` — ele recria o `index.html`.
3. Rode `bash tests/rodar.sh` e publique. O teste confere se o `index.html` bate com `src/` (se você esquecer o passo 2, o teste avisa) e roda o `npm run lint`, que acusa variável não declarada, repetida ou sem uso.

Traduções novas: adicione a frase em `src/idiomas/en.js` e `es.js` (a chave é o texto em português).

## Desafios e continuar de onde parou

- **Desafio da semana** (Menu → atalho): uma fase difícil (6×6) igual para todo mundo, que muda toda segunda-feira. Mostra a sequência de semanas seguidas e entra nas estatísticas, no recorde e no backup.
- **Contra o relógio** (Menu → atalho): 3 minutos para resolver o máximo de fases novas (começa fácil e sobe). Sem dicas; o tempo corre mesmo com o menu aberto. Guarda o melhor resultado, o total de corridas e de fases.
- **Fase em andamento**: o jogo guarda onde cada peça está, o tempo e as jogadas; ao reabrir, a fase volta como estava (campeonato e corrida não entram).
- **Relógio justo**: tela bloqueada, aba escondida ou celular congelado não contam no tempo da fase nem nas estatísticas (só o campeonato corre pelo relógio de parede, de propósito).

## Menu

O menu abre com quatro atalhos (**Fase do dia**, **Modo infinito**, **Estatísticas**, **Campeonatos**) e, abaixo, seções que abrem e fecham com um toque: **Fases** (já aberta), **Minhas fases**, **Jogo**, **Som**, **Aparência e idioma**, **Acessibilidade**, **Progresso e dados** (backup e zerar) e **Sobre e atualização** (versão, atualizar, modo de teste, compartilhar). Funciona também pelo teclado (Enter ou Espaço).

## Temas, acessibilidade e idiomas

- Menu → **Tema**: Automático (segue o claro/escuro do aparelho), Escuro (padrão), Claro, Oceano, Floresta, Pôr do sol, **Retrô (8 bits)** (cantos retos, molduras duplas e blocos com brilho de pixel) e **Madeira** (nogueira, carvalho e blocos pintados). A escolha fica salva; as cores das peças não mudam. Com alto contraste ligado, o tema escuro é usado.
- Menu → **Som → Estilo**: além de Calma, Animada e Noturna, cada tema tem a sua música (Meia-noite, Manhã, Maré, Mata, Entardecer, Chiptune e Madeira, todas geradas por código). Escolha **Música do tema** para ela mudar sozinha junto com o tema.
- Menu → **Acessibilidade**: modo para daltônicos (um símbolo em cada cor), alto contraste, texto maior e reduzir animações (segue também a configuração do aparelho).
- **Teclado**: setas movem o cursor no tabuleiro, `1`–`6` escolhe a peça, `R` gira, `T` espelha, `Enter`/`Espaço` encaixa ou tira a peça, `Z` desfaz, `P` pega a peça.
- **Leitor de tela**: tabuleiro, peças e botões têm rótulos e cada jogada é anunciada.
- **Idiomas**: Português, English e Español, escolhidos pelo idioma do aparelho e trocáveis em Menu → Idioma. As traduções ficam no bloco `DICT` do `index.html`; `tests/idiomas.js` confere se nada ficou sem tradução.

## Dica, solução e QR code

- **Dica em degraus** (botão da lâmpada ou tecla `H`): 1º toque marca a peça certa na lista (não conta como dica); 2º mostra o lugar no tabuleiro (conta como dica); 3º oferece a solução inteira.
- **Ver a solução**: mostra todas as peças no lugar, uma de cada vez; qualquer toque ou tecla encerra. Conta como dica (sem recorde e sem 3 estrelas). Não existe em campeonatos.
- **QR code**: em qualquer painel de compartilhar, o botão "Mostrar QR code" gera o código na hora, sem internet (biblioteca MIT embutida no `index.html`).

## Atualização do jogo

- Quem instalou o jogo (ou deixou aberto) recebe um aviso **"Tem uma versão nova do jogo"** com o botão **Atualizar o jogo**. O jogo confere sozinho ao abrir, ao voltar para ele e a cada 30 minutos.
- Também dá para conferir na hora em **Menu → Atualização → Verificar atualizações** (o menu mostra a versão atual).
- Ao atualizar, o jogo apaga o cache e recarrega; o progresso, as estrelas e os ajustes ficam guardados. A fase em andamento recomeça, e durante um campeonato a atualização espera.
- **Para publicar uma versão nova:** aumente a constante `VERSAO` em `src/js/atualizacao.js`, rode `node build.js` (formato `AAAA.MM.DD.N`, ex.: `2026.11.02.1`). Sem isso, o jogo não percebe que há novidade. O GitHub Pages pode levar alguns minutos para mostrar o arquivo novo.

## Modo infinito, estatísticas e backup

- **Modo infinito** (Menu → Modo infinito): o jogo cria fases novas na hora, sempre com solução única garantida. Cinco níveis — Fácil, Médio, Difícil, Mestre e Surpresa — cada um com sua contagem. A fase em andamento é lembrada; as fases difíceis são geradas em segundo plano (Web Worker) enquanto você joga a anterior.
- **Estatísticas** (Menu → Estatísticas): tempo jogado, vitórias, jogadas, dicas, fases e estrelas, melhores tempos, sequência de dias da fase do dia, progresso no infinito e fases criadas. Tudo fica só no aparelho.
- **Backup do progresso** (Menu → Backup do progresso): gera um **código** (copiar/colar) ou um **arquivo** `.json` com progresso, estrelas, recordes, fases criadas, estatísticas, infinito e ajustes. Para restaurar, cole o código ou escolha o arquivo e decida entre **Juntar** (mantém o melhor dos dois lados e não mexe nos ajustes do aparelho) ou **Substituir**. O backup **nunca** leva senhas, logins de organizador nem o modo de teste, e o código tem verificação contra cópia incompleta.

## Testes automáticos

A cada publicação o GitHub roda todos os testes (lógica das fases, regras do banco, telas no celular e no computador, gestos, campeonatos, tutorial, idiomas, temas, acessibilidade, dica, solução, QR code, atualização, modo infinito, estatísticas e backup). Para rodar na sua máquina: `npm install` e `bash tests/rodar.sh` (precisa de Node, Python e `pip install playwright && playwright install chromium`).

## Extras de jogo

- **Desfazer**: botão no topo (ou tecla Z) tira a última peça encaixada.
- **Peças por vez**: no menu, automático (5 ou mais), de 1 a 6 ou "Todas" — vale para todas as fases; campeonatos e tutorial mantêm a regra deles.
- **Tutorial inicial**: uma fase de ensino guiada (selecionar, girar, espelhar, encaixar) antes da Fase 1, só na primeira vez; dá para rever em Menu → Jogo → "Rever o tutorial".
- **Estrelas**: cada fase vale até 3 estrelas (sem dica e sem recolocar peças = 3). Aparecem ao vencer e no menu.
- **Vibração leve** no celular (pode desligar no menu).

---

Desenvolvido por [Rafajames](https://github.com/Rafajames)
