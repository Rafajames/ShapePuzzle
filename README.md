# Shape Puzzle - Custom Edition 🧩

Um jogo de quebra-cabeça lógico desenvolvido em **Java Swing**, onde o objetivo é preencher um tabuleiro 5x5 utilizando peças de diferentes formatos. O projeto conta com um **Editor de Fases** integrado que permite criar desafios com diferentes níveis de dificuldade.

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
