# Shape Puzzle - Custom Edition 🧩

Um jogo de quebra-cabeça lógico desenvolvido em **Java Swing**, onde o objetivo é preencher um tabuleiro 5x5 utilizando peças de diferentes formatos. O projeto conta com um **Editor de Fases** integrado que permite criar desafios com diferentes níveis de dificuldade.

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
- **Editor de fases** com exportação/importação `.txt` no mesmo formato da versão Java (o editor cria fases 5×5).

## 🚀 Funcionalidades

- **Mecânicas de Jogo:**
  - **Arrastar e Soltar:** Posicionamento intuitivo das peças no grid.
  - **Rotação (Tecla R):** Gira a peça selecionada em 90°.
  - **Inversão/Flip (Tecla T):** Espelha a peça horizontalmente (essencial para peças assimétricas).
  - **Remoção (Tecla E):** Remove uma peça específica do tabuleiro e a devolve para a reserva.
- **Editor de Fases:**
  - Interface visual para desenhar novos formatos.
  - **3 Níveis de Dificuldade:**
    - **Fácil:** Mostra todas as estrelas guia no tabuleiro.
    - **Médio:** Mostra apenas o início e o fim de cada peça.
    - **Difícil (Hard Mode):** Mostra apenas uma única estrela guia por peça, exigindo dedução lógica do jogador.
- **Sistema de IDs Únicos:** Lógica interna que permite gerenciar múltiplas peças da mesma cor de forma independente no tabuleiro.

## 🛠️ Tecnologias Utilizadas

- **Linguagem:** Java 17+
- **Interface Gráfica:** Java Swing / AWT
- **Gerenciamento de Dependências:** Maven
- **Algoritmos:** Busca em Profundidade (DFS) para mapeamento de formas e reconstrução de matrizes através de coordenadas relativas.

## 🎮 Como Jogar

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/Rafajames/ShapePuzzle.git](https://github.com/Rafajames/ShapePuzzle.git)

```

2. **Compile e execute:**
```bash
mvn clean install
mvn exec:java -Dexec.mainClass="com.rafajames.shapegame.Main"

```


3. **Comandos:**
* `Mouse`: Arrastar peças da reserva para o grid.
* `R`: Girar peça.
* `T`: Inverter (Flip) peça.
* `E`: Remover peça do grid (com o mouse sobre ela).



## 📂 Estrutura de Arquivos de Fase

As fases são salvas em arquivos `.txt` com a seguinte estrutura:

* `GABARITO:` Define a posição das estrelas guia baseadas na dificuldade escolhida.
* `PECAS_CUSTOM:` Armazena a estrutura vetorial das peças desenhadas.

---

Desenvolvido por [Rafajames](https://github.com/Rafajames)

## Testes automáticos

A cada publicação o GitHub roda todos os testes (lógica das fases, regras do banco, telas no celular e no computador, gestos, campeonatos e tutorial). Para rodar na sua máquina: `npm install` e `bash tests/rodar.sh` (precisa de Node, Python e `pip install playwright && playwright install chromium`).
