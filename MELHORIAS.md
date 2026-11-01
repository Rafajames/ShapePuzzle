# Ideias de melhoria do Shape Puzzle

Lista de ideias discutidas, por prioridade. Marque aqui o que for sendo feito.

## Mais importantes
1. **Tutorial dos gestos** — mãozinha animada guiando passo a passo no celular (toque seleciona, dois toques giram, deslizar espelha); some depois de alguns usos e pode ser reaberta no menu; animação de giro/espelho da peça. _Feito._
2. **Botão Desfazer** — desfaz a última jogada em vez de só reiniciar a fase. _Feito (botão no topo e tecla Z)._
3. **Testes automáticos no repositório** — rodar os testes no GitHub a cada publicação; consertar o teste instável. _Feito._
4. **Conferir os campeonatos de ponta a ponta** — teste real com duas pessoas no Firebase; tela de diagnóstico (banco / login / regras).

## Boas, menos urgentes
5. **Modo para daltônicos** — um símbolo em cada cor, ligável no menu. _Feito (menu → Acessibilidade)._
6. **Escolher quantas peças aparecem** — ajuste opcional (hoje: 6 → 3 conforme a dificuldade). _Feito (menu → Peças por vez)._
7. **Campeonato mais fácil de divulgar** — QR code do convite e botão "compartilhar ranking" (texto para WhatsApp).
8. **Editor de fases maior** — fases 6×6 e 7×7 e escolha de quantas peças aparecem por vez.
9. **Vibração leve no celular** e uma estrela de desempenho por fase (tempo/jogadas). _Feito: 3 estrelas = sem dica e sem recolocar peças; 2 = até 50% de jogadas a mais; 1 = o resto. Vibração liga/desliga no menu._

## Feito a pedido (fora da lista)
- **Acessibilidade** — jogar só com o teclado (setas, 1–6 escolhe peça, R/T gira/espelha, Enter/Espaço encaixa, Z desfaz), leitor de tela (rótulos e avisos de cada jogada), alto contraste, texto maior, reduzir animações e zoom liberado. _Feito (menu → Acessibilidade)._
- **Idiomas** — Português, English e Español; o jogo escolhe pelo idioma do aparelho e dá para trocar no menu. _Feito._

## Novas ideias (sem banco de dados)
Feitas: **fase do dia** e **fase por link** (já existiam).
1. **Dica em degraus** — 1º toque mostra só a peça (não conta como dica), 2º mostra o lugar, 3º oferece a solução. _Feito._
2. **Ver a solução animada** — mostra todas as peças no lugar, uma de cada vez; conta como dica. _Feito (3º toque na Dica)._
3. **QR code ao compartilhar** — botão "Mostrar QR code" no painel de compartilhar (jogo, fase por link, resultado). _Feito._
4. **Modo infinito** — fases novas geradas sozinhas, com solução garantida e vários níveis. _Depois._
5. **Estatísticas pessoais** — fases feitas, estrelas, tempo total e melhores marcas. _Depois._
6. **Temas e cores das peças** — claro/escuro e paletas, além do modo daltônico. _Depois._
7. **Conquistas e medalhas** guardadas no aparelho. _A ver._
8. **Modo dois jogadores no mesmo aparelho**, **modo criança**, **backup do progresso por código/arquivo**, **efeitos sonoros e mais músicas**. _A ver._

## Para pensar com cuidado
10. **Tempo de campeonato à prova de trapaça** — guardar a sequência de jogadas e conferir se resolve a fase.
11. **Limite de campeonatos por organizador.**
