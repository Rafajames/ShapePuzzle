package com.rafajames.shapegame.ui;

import com.rafajames.shapegame.model.*;
import java.awt.event.*;
import java.awt.Rectangle;
import java.util.List;

public class MouseManager extends MouseAdapter implements KeyListener {
    private Tabuleiro tabuleiro;
    private JanelaJogo janela;
    
    private final int TAMANHO_CELULA = 60;
    private final int OFFSET_X = (550 - (5 * 60)) / 2; 
    private final int OFFSET_Y = 30; 
    
    private int hX = -1, hY = -1; // Coordenadas da célula sob o mouse

    public MouseManager(Tabuleiro tabuleiro, JanelaJogo janela) {
        this.tabuleiro = tabuleiro;
        this.janela = janela;
    }

    @Override
    public void mouseMoved(MouseEvent e) {
        hX = (e.getX() - OFFSET_X) / TAMANHO_CELULA;
        hY = (e.getY() - OFFSET_Y) / TAMANHO_CELULA;
    }

    @Override
    public void mousePressed(MouseEvent e) {
        int mx = e.getX();
        int my = e.getY();
        janela.atualizarMouse(mx, my);

        // --- 1. CLIQUE NA RESERVA ---
        int reservaY = 380;
        List<Peca> reserva = janela.getReserva();

        if (my >= reservaY - 20) {
            for (int k = 0; k < reserva.size(); k++) {
                Peca p = reserva.get(k);
                
                int col = k % 4;
                int lin = k / 4;
                int xBase = 45 + (col * 125);
                int yBase = reservaY + (lin * 95);

                int[][] f = p.getFormato();
                int larguraHit = f[0].length * 22;
                int alturaHit = f.length * 22;

                Rectangle hitBox = new Rectangle(xBase, yBase, larguraHit, alturaHit);

                if (hitBox.contains(mx, my)) {
                    janela.setPecaArrastada(p);
                    janela.repaint();
                    return; 
                }
            }
        }
        
        janela.requestFocusInWindow();
        janela.repaint();
    }

    @Override
    public void mouseReleased(MouseEvent e) {
        Peca p = janela.getPecaArrastada();
        if (p != null) {
            int gx = (e.getX() - OFFSET_X) / TAMANHO_CELULA;
            int gy = (e.getY() - OFFSET_Y) / TAMANHO_CELULA;
            
            if (gx >= 0 && gy >= 0 && gx < 5 && gy < 5) {
                // Tenta colocar a peça no tabuleiro (O tabuleiro gera o ID único internamente)
                if (tabuleiro.podeColocarPeca(p.getFormato(), gx, gy)) {
                    tabuleiro.colocarPeca(p, gx, gy); 
                    janela.removerPecaDaReserva(p);
                    verificarVitoria();
                }
            }
        }
        janela.setPecaArrastada(null);
        janela.repaint();
    }

    @Override
    public void mouseDragged(MouseEvent e) {
        janela.atualizarMouse(e.getX(), e.getY());
        hX = (e.getX() - OFFSET_X) / TAMANHO_CELULA;
        hY = (e.getY() - OFFSET_Y) / TAMANHO_CELULA;
        janela.repaint();
    }

    @Override
    public void keyPressed(KeyEvent e) {
        // --- TECLA E: REMOVER PEÇA ÚNICA ---
        if (e.getKeyCode() == KeyEvent.VK_E) {
            if (hX >= 0 && hY >= 0 && hX < 5 && hY < 5) {
                // Remove apenas a instância clicada e a devolve para a reserva
                Peca original = tabuleiro.removerPecaPelaPosicao(hX, hY);
                if (original != null) {
                    janela.adicionarPecaAReserva(original);
                }
            }
        }

        // --- TECLA R: GIRAR PEÇA ARRASTADA ---
        if (e.getKeyCode() == KeyEvent.VK_R && janela.getPecaArrastada() != null) {
            janela.getPecaArrastada().girar();
        }

        // --- TECLA T: INVERTER PEÇA ARRASTADA ---
        if (e.getKeyCode() == KeyEvent.VK_T && janela.getPecaArrastada() != null) {
            janela.getPecaArrastada().inverter();
        }
        
        janela.repaint();
    }

    private void verificarVitoria() {
        if (tabuleiro.isNivelConcluido()) {
            janela.ativarBotaoNovaFase();
        }
    }

    @Override public void keyReleased(KeyEvent e) {}
    @Override public void keyTyped(KeyEvent e) {}
}