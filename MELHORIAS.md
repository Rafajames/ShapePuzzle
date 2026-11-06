# Ideias de melhoria do Shape Puzzle

Lista de ideias discutidas, por prioridade. Marque aqui o que for sendo feito.

## Mais importantes
1. **Tutorial dos gestos** — mãozinha animada guiando passo a passo no celular (toque seleciona, dois toques giram, deslizar espelha); some depois de alguns usos e pode ser reaberta no menu; animação de giro/espelho da peça. _Feito._
2. **Botão Desfazer** — desfaz a última jogada em vez de só reiniciar a fase. _Feito (botão no topo e tecla Z)._
3. **Testes automáticos no repositório** — rodar os testes no GitHub a cada publicação; consertar o teste instável. _Feito._
4. **Conferir os campeonatos de ponta a ponta** — teste real com duas pessoas no Firebase; tela de diagnóstico (banco / login / regras).

## Boas, menos urgentes
5. **Modo para daltônicos** — um símbolo em cada cor, ligável no menu. _Feito (menu → Acessibilidade)._
6. **Escolher quantas peças aparecem** — ajuste opcional (padrão mínimo de 5; o jogador pode reduzir para 1–4). _Feito (menu → Peças por vez)._
7. **Campeonato mais fácil de divulgar** — QR code do convite e botão "compartilhar ranking" (texto para WhatsApp).
8. **Editor de fases maior** — fases 6×6 e 7×7 e escolha de quantas peças aparecem por vez.
9. **Vibração leve no celular** e uma estrela de desempenho por fase (tempo/jogadas). _Feito: 3 estrelas = sem dica e sem recolocar peças; 2 = até 50% de jogadas a mais; 1 = o resto. Vibração liga/desliga no menu._

## Feito a pedido (fora da lista)
- **Acessibilidade** — jogar só com o teclado (setas, 1–6 escolhe peça, R/T gira/espelha, Enter/Espaço encaixa, Z desfaz), leitor de tela (rótulos e avisos de cada jogada), alto contraste, texto maior, reduzir animações e zoom liberado. _Feito (menu → Acessibilidade)._
- **Idiomas** — Português, English e Español; o jogo escolhe pelo idioma do aparelho e dá para trocar no menu. _Feito._
- **Conta com o Google, nome, avatar e moldura** — _Feito (Etapa A)._ _Etapa B feita:_ ranking geral, campeonato da semana (salas de até 100) e aviso de posição ao abrir. Próximas: desafiar amigos (+ denunciar/bloquear), loja/anúncios com brinde.

## Novas ideias (sem banco de dados)
Feitas: **fase do dia** e **fase por link** (já existiam).
1. **Dica em degraus** — 1º toque mostra só a peça (não conta como dica), 2º mostra o lugar, 3º oferece a solução. _Feito._
2. **Ver a solução animada** — mostra todas as peças no lugar, uma de cada vez; conta como dica. _Feito (3º toque na Dica)._
3. **QR code ao compartilhar** — botão "Mostrar QR code" no painel de compartilhar (jogo, fase por link, resultado). _Feito._
4. **Modo infinito** — fases novas geradas sozinhas, com solução garantida e 5 níveis (Fácil a Mestre). _Feito (Menu → Modo infinito)._
5. **Estatísticas pessoais** — fases feitas, estrelas, tempo total, sequência de dias e melhores marcas. _Feito (Menu → Estatísticas)._
6. **Temas** — Automático (segue o aparelho), Escuro, Claro, Oceano, Floresta e Pôr do sol, em Menu → Tema. _Feito._ Cores diferentes para as peças ficam para depois.
7. **Conquistas e medalhas** guardadas no aparelho. _A ver._
8. **Modo dois jogadores no mesmo aparelho**, **modo criança**, **efeitos sonoros e mais músicas**. _A ver._

8b. **Backup do progresso** — código ou arquivo, juntar ou substituir, sem senhas. _Feito (Menu → Backup do progresso)._
9. **Atualização do jogo instalado** — aviso de versão nova + botão "Verificar atualizações" no menu. _Feito._ (A cada publicação, aumentar `VERSAO` em `src/js/atualizacao.js` e rodar `node build.js`.)

- **Código mais limpo** — o jogo agora é editado em `src/` (CSS, JS por assunto, idiomas) e o `index.html` é gerado por `node build.js`; verificação automática de código (lint) e plural corrigido no backup. _Feito._

- **Desafio da semana, contra o relógio, fase em andamento e relógio sem saltos.** _Feito._

## Para pensar com cuidado
10. **Tempo de campeonato à prova de trapaça** — guardar a sequência de jogadas e conferir se resolve a fase.
11. **Limite de campeonatos por organizador.**

- **Campeonato sem internet por QR code** — _Feito (Campeonatos → Campeonato sem internet)._

- **Fase de tutorial antes da Fase 1** — guiada passo a passo, só para quem está começando. _Feito._
