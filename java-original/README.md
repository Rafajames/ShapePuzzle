# Shape Puzzle — versão Java original

Esta é a primeira versão do jogo, em **Java Swing** (computador). O jogo que está publicado e recebe as novidades é a versão web, no `index.html` da pasta principal — **esta pasta não é usada por ela**.

Os arquivos de fase `.txt` têm o mesmo formato nas duas versões, então uma fase criada em uma abre na outra.

## Como rodar

Precisa de Java 17+ e Maven.

```bash
git clone https://github.com/Rafajames/ShapePuzzle.git
cd ShapePuzzle/java-original
mvn clean install
mvn exec:java -Dexec.mainClass="com.rafajames.shapegame.Main"
```

## Comandos

- `Mouse`: arrastar peças da reserva para o tabuleiro.
- `R`: girar a peça. `T`: inverter (espelhar). `E`: remover a peça do tabuleiro (com o mouse sobre ela).

## O que tem

- Editor de fases visual (`EditorFases`) com 3 níveis: **Fácil** (todas as estrelas guia), **Médio** (início e fim de cada peça) e **Difícil** (uma estrela por peça).
- IDs únicos por peça, para várias peças da mesma cor no tabuleiro.
- Busca em profundidade (DFS) para mapear formas e reconstruir matrizes a partir de coordenadas relativas.

## Formato das fases

Arquivos `.txt` com:

- `GABARITO:` posição das estrelas guia, conforme a dificuldade.
- `PECAS_CUSTOM:` estrutura vetorial das peças desenhadas.
