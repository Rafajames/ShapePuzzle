# Publicação na Google Play — roteiro

Guia para preencher o Play Console. Antes de publicar, confira cada resposta com a versão final do app (principalmente a parte de anúncios).

## Links públicos (já no ar)
- Política de privacidade: https://rafajames.github.io/ShapePuzzle/privacidade.html
- Termos de uso: https://rafajames.github.io/ShapePuzzle/termos.html
- Exclusão de conta pela internet (link que o formulário de Segurança dos dados pede): https://rafajames.github.io/ShapePuzzle/excluir-conta.html
- No jogo: Menu → Sobre e atualização (três links) e, na tela de login, a caixa de aceite dos termos.

## Conta de desenvolvedor
- Taxa única de US$ 25; verificação de identidade com documento; mais de 18 anos.
- Conta **pessoal**: teste fechado com **12 testadores por 14 dias seguidos** antes de pedir acesso à produção; confirmar um aparelho Android pelo app Play Console.
- Alvo do app: **Android 16 (API 36)** ou mais novo.
- E-mail de contato do desenvolvedor: obrigatório na ficha da loja (fica público). A política de privacidade usa hoje só o GitHub como contato; se quiser, acrescente um e-mail dedicado ao jogo nas páginas.

## Segurança dos dados (Data safety)
Respostas para a versão com login e anúncios premiados:

| Tipo de dado | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|---|---|---|---|---|
| Informações pessoais → **Endereço de e-mail** | Sim (login com o Google, pelo Firebase Authentication) | Não | Opcional (o login é opcional) | Gerenciamento da conta |
| Informações pessoais → **Nome** | Sim (o apelido escolhido, público) | Não | Opcional | Funcionalidade do app, gerenciamento da conta |
| Informações pessoais → **IDs de usuário** | Sim (identificador da conta) | Não | Opcional | Funcionalidade do app, gerenciamento da conta |
| Atividade no app → **Outras ações no app** (progresso, estrelas, fases concluídas) | Sim | Não | Opcional | Funcionalidade do app |
| Dispositivo ou outros IDs → **ID de publicidade** | Sim, quando houver anúncios (AdMob) | Sim, com o Google AdMob | Opcional (anúncio é opcional) | Publicidade |
| Fotos, localização, contatos, mensagens, financeiro, saúde | **Não** | — | — | — |

Perguntas fixas:
- Dados criptografados em trânsito: **Sim** (HTTPS).
- Os usuários podem pedir a exclusão: **Sim**. Link: página de exclusão acima. Dentro do app: Sua conta → Conta e nuvem → Apagar minha conta e meus dados.
- Conferir também a lista oficial de dados do AdMob quando o plugin de anúncios entrar (ele pode acrescentar dados aproximados de localização, interações e diagnóstico).

## Conteúdo do app
- **Público-alvo:** 13 anos ou mais (não marcar "menores de 13"; assim as regras de apps para crianças não se aplicam). Evite visual infantil nas imagens da loja.
- **Classificação indicativa (IARC):** sem violência, sem conteúdo sexual, sem apostas com dinheiro real (estrelas são virtuais e não compram nada com dinheiro); marque que usuários veem apelidos de outros usuários.
- **Anúncios:** o app contém anúncios (premiados, só quando a pessoa escolhe assistir).
- **Acesso ao app:** todo o jogo funciona sem login; não é preciso dar conta de teste ao revisor.
- **Conteúdo gerado por usuários:** apelidos e nomes de campeonatos. Exigências do Google: termos aceitos antes de criar conta (feito), **denunciar** e **bloquear** dentro do app (**feito**: botão ⋯ nos rankings; ver [moderacao.md](moderacao.md)) e moderação contínua. Já existe filtro de apelidos ofensivos.
- **Compras:** se um dia vender estrelas ou itens por dinheiro, é obrigatório usar o Google Play Billing; estrelas ganhas jogando ou por anúncio não têm esse requisito.
- **Europa:** declarar a situação de "comerciante" (DSA) se o app tiver monetização; consentimento de anúncios (formulário do Google) para Europa e Reino Unido.

## Ficha da loja
- Categoria: Quebra-cabeça. Título: **Shape Puzzle**.
- Descrição curta (até 80 caracteres): "Encaixe todas as peças no tabuleiro. Fases novas sem parar, com música." 
- Descrição completa: tabuleiro e peças, dica em degraus, fase do dia, desafio da semana, modo infinito, campeonatos com amigos, avatares e molduras, música gerada por código, sem cadastro obrigatório.
- Ícone 512×512: `icon-512.png` (já existe). Gráfico de recursos 1024×500: a criar. Capturas de tela: pelo menos 2 (proporção 9:16), de preferência 4 a 8, em cada idioma.
- Traduções da ficha: mesmos idiomas do jogo (as da loja são feitas à parte no console).

## Antes de publicar
1. Abrir a conta Play e reunir os 12 testadores (14 dias).
2. Gerar o app Android (Capacitor) com login nativo e anúncios; assinar com a chave guardada com segurança (nunca no Git).
3. Denunciar e bloquear dentro do jogo (junto com ranking/amigos).
4. Preencher Segurança dos dados, classificação, público-alvo e ficha com este roteiro.
5. Publicar no teste fechado, depois pedir produção.
