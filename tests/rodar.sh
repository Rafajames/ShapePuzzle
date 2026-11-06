#!/usr/bin/env bash
# Roda todos os testes do Shape Puzzle. Uso: bash tests/rodar.sh
cd "$(dirname "$0")/.."
PORTA=8765
pkill -f "http.server $PORTA" 2>/dev/null
python3 -m http.server $PORTA --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
FALHOU=0
rodar() { echo; echo "=== $1 ==="; if ! "${@:2}"; then echo ">>> FALHOU: $1"; FALHOU=1; fi; }
rodar "index.html confere com src/" node build.js --conferir
rodar "lint" node tests/lint.js
for t in logica campeonato-logica regras solucao backup progresso offline idiomas fases-geradas conta-logica; do rodar "$t" node tests/$t.js; done
# testes de tela: rodam em paralelo (PARALELO=1 para rodar um de cada vez); o log de cada um fica em tests/saida/log-*.txt
UI="ui_geral ui_tamanhos ui_campeonato ui_gestos ui_tutorial ui_desfazer_pecas ui_estrelas ui_modo_teste ui_tela ui_fileiras ui_idiomas ui_acessibilidade ui_dica_solucao_qr ui_temas ui_atualizacao ui_infinito ui_estatisticas_backup ui_menu ui_andamento_desafios ui_offline ui_tutorial_fase ui_inicio ui_fases_crescem ui_festa ui_conta ui_paginas ui_ranking ui_voltar ui_nativo ui_idiomas_todos"
mkdir -p tests/saida
P=${PARALELO:-3}
echo; echo "=== testes de tela ($P de cada vez) ==="
echo $UI | tr ' ' '\n' | xargs -P "$P" -I{} sh -c 'if python3 tests/{}.py > tests/saida/log-{}.txt 2>&1; then echo "ok     {}"; else echo ">>> FALHOU: {} (veja tests/saida/log-{}.txt)"; fi' | tee tests/saida/resumo-ui.txt
# o que falhou em paralelo roda de novo sozinho (alguns testes medem tempo e podem falhar com a máquina ocupada)
for t in $(grep -o "FALHOU: [a-z_]*" tests/saida/resumo-ui.txt | cut -d' ' -f2); do rodar "$t (de novo, sozinho)" python3 tests/$t.py; done
echo
[ $FALHOU = 0 ] && echo "TODOS OS TESTES PASSARAM" || echo "HÁ TESTES COM FALHA"
exit $FALHOU
