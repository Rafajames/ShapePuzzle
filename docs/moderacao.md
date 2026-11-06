# Moderação — denúncias, bloqueio e banimento (dá para fazer pelo celular)

## O que o jogador vê
- Em todo ranking (ranking geral e salas de campeonato) há um botão **⋯** ao lado de cada jogador: **Denunciar** (motivo: nome ou imagem ofensiva, trapaça, outro) e **Bloquear**.
- Bloquear vale só no aparelho de quem bloqueou: o nome e o avatar viram "Jogador bloqueado". A lista fica em Meu perfil → Jogadores bloqueados (dá para desbloquear).
- Na sala de um campeonato entre amigos há o botão **Denunciar** (para o nome do campeonato).

## Onde ver as denúncias
Realtime Database → Dados → nó **`den`**:
https://console.firebase.google.com/project/shapepuzzle-76162/database/shapepuzzle-76162-default-rtdb/data/~2Fden

Cada denúncia tem: `tipo` (jogador ou camp), `alvo` (chave do jogador ou código do campeonato), `nome` (o que estava escrito), `sala` (código da sala, quando foi numa sala), `motivo`, `ts` (data em milissegundos) e `por` (id de quem denunciou, se estava com conta). Só você lê esse nó; os jogadores conseguem apenas enviar.

## Como agir
**Apelido ofensivo de quem tem conta (ranking geral / campeonato da semana)**
1. Em `pub`, ache a conta cujo id **começa** com o `alvo` da denúncia (o alvo são os 24 primeiros caracteres do id).
2. Em **`ban`**, crie um filho com o id completo da conta e valor `true` (ex.: `ban/AbCd...xyz = true`). Com isso a conta não consegue mais publicar o perfil nem entrar no campeonato da semana.
3. Apague o nó dela em `pub` (some do ranking geral) e, se ela estiver numa sala da semana, apague `p/<código da sala>/<alvo>`.
4. Para perdoar depois: apague o filho em `ban`; no próximo login/sincronização o perfil volta.

**Trapaça num campeonato**: apague o resultado em `p/<sala>/<alvo>/f` (ou o jogador inteiro em `p/<sala>/<alvo>`). Em reincidência, use o banimento acima.

**Nome de campeonato ofensivo**: apague `c/<código>` e `p/<código>`.

**Depois de resolver**: apague a denúncia em `den` (ou deixe guardada como histórico).

## Para a Google Play
- O jogo tem: aceite dos termos antes de criar conta, filtro de apelidos, denunciar e bloquear dentro do app, e moderação pelas denúncias. É o que a política de conteúdo gerado pelo usuário pede.
- Responda as denúncias com frequência (a política pede ação "em tempo razoável").
