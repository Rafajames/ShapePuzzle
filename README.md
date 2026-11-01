# Shape Puzzle 🧩

Quebra-cabeça lógico: encaixe todas as peças no tabuleiro até preencher tudo. Roda direto no navegador (computador e celular), com música, campeonatos, acessibilidade e três idiomas. Feito por [Rafajames](https://github.com/Rafajames).

## 🌐 Jogar online

**https://rafajames.github.io/ShapePuzzle/**

Versão web em um único `index.html` (sem instalar nada), que roda no computador e no celular:

- **50 fases** com dificuldade crescente: as 30 primeiras em 5×5; da 31 em diante o tabuleiro cresce (6×6 e 7×7) e, em algumas fases, só aparecem as próximas 3, 2 ou 1 peças da fila (as outras entram conforme você encaixa). Todas as fases novas têm solução única.
- **Fase do dia**: um desafio novo por dia, igual para todo mundo, com sequência de dias seguidos.
- **Peças por vez**: nas primeiras 10 fases aparecem 6 peças; depois 5, 4 e, da fase 31 em diante, 3 (algumas fases do final usam fila de 1 a 3). Ao encaixar uma, a seguinte entra.
- **No celular**: dois toques giram a peça 90° e deslizar o dedo espelha. No computador ficam os botões e as teclas R e T.
- **Dica**: mostra onde vai uma peça. Partidas com dica não valem recorde.
- **Tempo, jogadas e recorde** por fase.
- **Música gerada por código** (Web Audio API) em 3 climas — Calma, Animada e Noturna — que mudam sozinhos a cada 10 fases ou ficam fixos à sua escolha.
- **Compartilhar**: o jogo, o seu resultado e as fases que você criar, por link (sem enviar arquivo).
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
| `index.html` | O jogo inteiro (código, fases, músicas, traduções) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Instalar como app e jogar offline |
| `firebase-rules.json`, `CAMPEONATOS.md` | Regras e guia do banco dos campeonatos |
| `tests/` | Testes automáticos (rodam no GitHub a cada publicação) |
| `fases-web/` | Fases 31–50 em `.txt` (cópia de referência; já estão no `index.html`) |
| `java-original/` | Primeira versão em Java Swing — não é usada pelo jogo web ([veja o README dela](java-original/README.md)) |
| `MELHORIAS.md` | Lista de ideias e o que já foi feito |

## Temas, acessibilidade e idiomas

- Menu → **Tema**: Automático (segue o claro/escuro do aparelho), Escuro (padrão), Claro, Oceano, Floresta e Pôr do sol. A escolha fica salva; as cores das peças não mudam. Com alto contraste ligado, o tema escuro é usado.
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
- **Para publicar uma versão nova:** aumente a constante `VERSAO` no `index.html` (formato `AAAA.MM.DD.N`, ex.: `2026.11.02.1`). Sem isso, o jogo não percebe que há novidade. O GitHub Pages pode levar alguns minutos para mostrar o arquivo novo.

## Testes automáticos

A cada publicação o GitHub roda todos os testes (lógica das fases, regras do banco, telas no celular e no computador, gestos, campeonatos, tutorial, idiomas, temas, acessibilidade, dica, solução, QR code e atualização). Para rodar na sua máquina: `npm install` e `bash tests/rodar.sh` (precisa de Node, Python e `pip install playwright && playwright install chromium`).

## Extras de jogo

- **Desfazer**: botão no topo (ou tecla Z) tira a última peça encaixada.
- **Peças por vez**: no menu, escolha de 2 a 6 ou "Todas" (fases com fila própria e campeonatos mantêm a regra delas).
- **Estrelas**: cada fase vale até 3 estrelas (sem dica e sem recolocar peças = 3). Aparecem ao vencer e no menu.
- **Vibração leve** no celular (pode desligar no menu).

---

Desenvolvido por [Rafajames](https://github.com/Rafajames)
