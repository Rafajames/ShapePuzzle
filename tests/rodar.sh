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
for t in logica campeonato-logica regras solucao idiomas; do rodar "$t" node tests/$t.js; done
for t in ui_geral ui_tamanhos ui_campeonato ui_gestos ui_tutorial ui_desfazer_pecas ui_estrelas ui_modo_teste ui_tela ui_fileiras ui_idiomas ui_acessibilidade ui_dica_solucao_qr ui_temas; do rodar "$t" python3 tests/$t.py; done
echo
[ $FALHOU = 0 ] && echo "TODOS OS TESTES PASSARAM" || echo "HÁ TESTES COM FALHA"
exit $FALHOU
