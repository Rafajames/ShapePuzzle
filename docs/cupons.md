# Cupons — como criar (dá para fazer pelo celular)

Os cupons ficam no banco do Firebase, no nó `cupons`. Só você cria e muda cupons, pelo console (os jogadores só conseguem ler um cupom quando digitam o código certo; ninguém consegue listar todos). Cada cupom vale **uma vez por aparelho / conta**.

## Criar um cupom

1. Abra **Realtime Database → Dados**: https://console.firebase.google.com/project/shapepuzzle-76162/database/shapepuzzle-76162-default-rtdb/data
2. Na raiz (a primeira linha), toque em **+**.
   - Se ainda não existir o nó `cupons`: em **Chave** escreva `cupons`, deixe o valor vazio e toque em **+** de novo para criar um filho dentro dele.
3. Dentro de `cupons`, crie um filho com o **código do cupom** como chave (só letras MAIÚSCULAS, números, `-` ou `_`, de 3 a 20 caracteres). Exemplo: `BEMVINDO`.
4. Dentro do código, crie os campos que quiser:

| Campo | Tipo | Exemplo | O que faz |
|---|---|---|---|
| `estrelas` | número | `50` | estrelas de presente (até 1000) |
| `itens` | texto | `av:a1,mold:neon,fun:cosmos` | avatares, molduras e fundos de presente (separe por vírgula) |
| `ate` | texto | `2026-12-31` | último dia em que o cupom vale (opcional) |
| `desde` | texto | `2026-12-24` | primeiro dia em que o cupom vale (opcional) |

5. Toque em **Adicionar**. Pronto: o cupom já funciona no jogo (Meu perfil → aba Estrelas → Cupom). O jogador pode digitar em minúsculas e com espaços; o jogo ajusta.

Exemplo em JSON (também dá para importar pelo menu ⋮ → Importar JSON, mas **importar na raiz apaga o resto do banco** — importe só dentro do nó `cupons`):

```json
{
  "BEMVINDO": {"estrelas": 50},
  "NATAL2026": {"estrelas": 30, "itens": "fun:estrelas,mold:gelo", "desde": "2026-12-20", "ate": "2026-12-31"},
  "ANIMEFAN": {"itens": "av:a7"}
}
```

Para encerrar um cupom antes da hora: apague o nó dele ou coloque `ate` com a data de ontem.

## Códigos dos itens

**Avatares** (`av:...`)
- Bichos e pessoas: `p1` Léo, `p2` Bia, `p3` Gatinho, `p4` Cãozinho, `p5` Ursinho, `p6` Coelha (livres) · `p7` Raposa, `p8` Panda, `p9` Sapinho, `p10` Leão, `p11` Davi, `p12` Lia, `p13` Hamster, `p14` Astronauta (raros) · `p15` Tigre, `p16` Lobo, `p17` Pirata, `p18` Maga do Fogo (épicos) · `p19` Rainha, `p20` Detetive, `p21` Robozinho, `p22` Alien, `p23` Unicórnio, `p24` Dragão (prêmios de conquista — um cupom também libera)
- Heróis estilo anime: `a1` Ninja da Névoa, `a2` Menina-gato, `a3` Samurai Errante, `a4` Aprendiz de Magia (raros) · `a5` Piloto de Robô, `a6` Espadachim de Prata, `a7` Garota Mágica, `a8` Espírito-raposa (épicos) · `a9` Dragãozinho, `a10` Rei das Sombras, `a11` Anjo da Aurora, `a12` Androide (lendários)

**Molduras** (`mold:...`): `madeira` (livre) · `pixel`, `festa`, `marmore`, `metal` (raras) · `neon`, `cristal`, `lava`, `gelo`, `fogo` (épicas) · `galaxia`, `ouro`, `arco` (lendárias)

**Fundos** (`fun:...`): `listras`, `bolinhas` (livres) · `xadrez`, `diagonal`, `ceu` (raros) · `estrelas`, `aurora`, `oceano` (épicos) · `cosmos`, `dourado` (lendários)

**Cores das peças** (`cor:...`): `pastel`, `terra` (raras) · `doce`, `neon` (épicas) · `joia` (lendária)

**Natal** (presentes do calendário; um cupom também libera): `fun:neve` (dia 7), `cor:natal` (dia 14), `mold:neve` (dia 21), `mold:natal` (dia 25) · `fun:natal` fica à venda só em dezembro

## Cupom de Natal (sugestão)
Crie em `cupons/NATAL2026`: `estrelas: 25`, `itens: "fun:natal"`, `desde: "2026-12-01"`, `ate: "2026-12-31"`. Divulgue o código no grupo ou nas redes em 1º de dezembro.

## Limites
- Sem conta Google, quem apagar os dados do navegador consegue usar o mesmo cupom de novo naquele aparelho. Com a conta, o uso fica guardado na nuvem e vale em todos os aparelhos.
- Cupom com limite de pessoas (ex.: "os 100 primeiros") precisaria de um servidor; por enquanto use a data `ate` para limitar.
