# Campeonatos no Shape Puzzle

O jogo permite criar **campeonatos**: o organizador escolhe as fases, o número de pessoas e o prazo, manda o link, e cada participante entra **só com o nome** (sem e-mail e sem senha). Depois de jogar, todos veem a posição no ranking.

Os campeonatos ficam no **Firebase** (banco gratuito do Google). O banco oficial do jogo já está ligado no código (`NUVEM_PADRAO` e `NUVEM_CHAVE` no `index.html`); o endereço e a chave do app web **não são segredo** — quem protege os dados são as regras do banco (`firebase-rules.json`).

## Configuração do banco (uma vez, por quem mantém o jogo)

1. **Realtime Database** → aba **Regras** → cole o conteúdo de [`firebase-rules.json`](firebase-rules.json) → **Publicar**.
2. **Authentication** → **Método de login** → ative **E-mail/senha** (não precisa ligar o "link por e-mail"). É isso que permite a senha de organizador.
3. Plano **Spark** (gratuito). Não ative o plano pago sem necessidade: no gratuito, se o uso passar do limite, o banco só para até o mês virar, sem cobrança.

Sempre que o arquivo de regras mudar, publique de novo na aba **Regras**.

## Para o organizador

- **Primeira vez:** em *Campeonatos*, digite seu nome, crie uma **senha de organizador** (mínimo 6 caracteres) e repita-a. O nome vira a sua conta de organizador (não é pedido e-mail).
- **Depois:** o aparelho fica reconhecido e a senha não é pedida de novo. Se você limpar os dados do navegador ou usar outro aparelho, abra o campeonato e toque em **Sou o organizador**, ou crie um novo e digite a mesma senha.
- **Esqueceu a senha?** Não há recuperação por e-mail (não existe e-mail de verdade). Use outro nome de organizador, ou apague a conta em *Authentication → Usuários* no console.
- **Editar:** enquanto **ninguém** entrou no campeonato (nem o próprio organizador), dá para mudar nome, fases, número de pessoas, prazo e modo. Quando a primeira pessoa entra, fica travado, para ninguém mudar as regras com gente jogando.
- **Excluir:** o organizador pode excluir o campeonato quando quiser. Isso apaga também o ranking e os participantes.

## Para quem participa

Abra o link do convite (ou digite o código de 6 letras em *Campeonatos*), digite o nome e jogue. `Ana`, `ana` e `ANA` são a mesma pessoa; se duas pessoas usarem o mesmo nome, vão dividir a conta — use nomes diferentes, como "Ana S." e "Ana M.".

## Regras do jogo

- O ranking ordena por **fases concluídas** (mais é melhor), depois **tempo total** (menor), depois **jogadas**.
- Dois modos: **o melhor tempo de cada fase** (dá para melhorar) ou **só a primeira vez que concluir**.
- Não há dicas, o cronômetro começa ao abrir a fase e **não para** com o menu aberto, e limpar o tabuleiro não zera o tempo.
- Sem internet, o resultado fica guardado no aparelho e é enviado quando a conexão volta.
- A sala atualiza o ranking sozinha a cada 10 segundos.

## Apagar dados dentro do Firebase

Pelo console você pode tudo, sem passar pelas regras:

- **Um campeonato:** *Realtime Database → Dados* → expanda `c` e `p`, passe o mouse sobre o código e clique no **X** (apague nos dois lugares).
- **Todos os campeonatos:** apague os nós `c` e `p`.
- **Todo o banco:** menu ⋮ da aba Dados → **Excluir banco de dados** (ou *Configurações do projeto → Excluir projeto*). O jogo continua funcionando para jogar; só os campeonatos deixam de existir.

## Limites (leia antes de apostar prêmio)

- **Dá para trapacear.** O tempo é calculado no aparelho de quem joga. As regras recusam valores impossíveis (menos de 0,5 s, por exemplo), mas não provam que a partida aconteceu.
- **O limite de pessoas é conferido pelo jogo**, não pelo banco: se duas pessoas entrarem ao mesmo tempo na última vaga, as duas podem entrar.
- **Quem tem o link vê o campeonato inteiro** (nomes, tempos e fases). Não use nomes completos nem dados pessoais.
- **Qualquer pessoa pode criar uma conta de organizador** e criar campeonatos; não há limite por pessoa. Acompanhe o uso no console. Se um dia virar abuso, dá para exigir um código de convite de organizador ou restringir a chave da API (*Google Cloud → Credenciais*).
- O prazo é conferido pelo banco com o relógio dele.
