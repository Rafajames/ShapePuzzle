# Campeonatos no Shape Puzzle

O jogo permite criar **campeonatos**: o organizador escolhe as fases, o número de pessoas e o prazo, manda o link, e cada participante entra **só com o nome** (sem e-mail e sem senha). Depois de jogar, todos veem a posição no ranking.

Para guardar os campeonatos e os resultados é preciso um banco de dados. O jogo usa o **Firebase Realtime Database**, que tem plano gratuito e não pede cartão para o uso básico. **Só quem cria campeonatos precisa fazer a configuração abaixo, uma vez.** Quem recebe o convite não configura nada: o link já leva o endereço do banco.

## Configurar (uns 5 minutos)

1. Entre em <https://console.firebase.google.com> com uma conta Google e clique em **Criar um projeto** (pode desligar o Google Analytics).
2. No menu do projeto, abra **Criação → Realtime Database** e clique em **Criar banco de dados**. Escolha a região e, quando perguntar, o modo **bloqueado** (as regras do passo 3 substituem esse modo).
3. Abra a aba **Regras**, apague o conteúdo, cole o conteúdo do arquivo [`firebase-rules.json`](firebase-rules.json) e clique em **Publicar**.
4. Na aba **Dados**, copie o endereço que aparece no topo, parecido com `https://nome-do-projeto-default-rtdb.firebaseio.com`.
5. No jogo: menu (☰) → **Campeonatos** → abra **Banco de dados**, cole o endereço e toque em **Salvar endereço**.

Pronto: toque em **Criar campeonato**, monte as fases e use **Convidar** para mandar o link pelo WhatsApp, Telegram, e-mail ou copiando.

> Opcional: para que todo mundo que abrir o jogo use o mesmo banco (sem cada organizador configurar o seu), coloque o endereço na constante `NUVEM_PADRAO` do `index.html` e publique de novo.

## Como funciona

- Cada campeonato tem um **código de 6 letras/números** (ex.: `K7M2QX`). O link do convite já contém o código e o endereço do banco.
- Quem entra informa um nome. O nome vira a identidade da pessoa naquele campeonato (`Ana`, `ana` e `ANA` são a mesma pessoa). Se duas pessoas usarem o mesmo nome, vão dividir a mesma conta — por isso use nomes diferentes, como "Ana S." e "Ana M.".
- O ranking ordena por **fases concluídas** (mais é melhor), depois **tempo total** (menor), depois **jogadas**. Quem concluiu todas as fases aparece à frente de quem concluiu só algumas.
- Dois jeitos de valer o resultado: **o melhor tempo de cada fase** (dá para melhorar) ou **só a primeira vez que concluir**.
- No campeonato **não há dicas**, o **cronômetro começa ao abrir a fase** e não para com o menu aberto, e limpar o tabuleiro não zera o tempo.
- Sem internet, o resultado fica guardado no aparelho e é enviado quando a conexão volta.
- A sala atualiza o ranking sozinha a cada 10 segundos enquanto está aberta.

## Limites (leia antes de apostar prêmio)

É um sistema simples, pensado para diversão entre pessoas que se conhecem:

- **Dá para trapacear.** O resultado é calculado no aparelho de quem joga e enviado ao banco; alguém que entenda de navegador consegue enviar um tempo falso. As regras recusam valores impossíveis (menos de 0,5 s, por exemplo), mas não provam que a partida aconteceu.
- **O limite de pessoas é conferido pelo jogo**, não pelo banco. Se duas pessoas entrarem exatamente ao mesmo tempo na última vaga, as duas podem entrar.
- **Quem tem o link vê o campeonato inteiro** (nomes, tempos e fases). Não use nomes completos nem dados pessoais.
- **Quem tem o endereço do banco** (ele aparece no link) pode criar campeonatos nele. Use um banco só para o jogo e acompanhe o uso no console do Firebase.
- Não há como recuperar um nome "perdido" nem trocar de nome no meio do campeonato: quem entrar com outro nome vira outra pessoa.
- O prazo é conferido pelo banco com o relógio dele; o jogo também esconde o botão de jogar depois do prazo.
