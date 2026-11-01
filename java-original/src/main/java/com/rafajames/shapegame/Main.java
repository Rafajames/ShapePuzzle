package com.rafajames.shapegame;

import com.rafajames.shapegame.model.Tabuleiro;
import com.rafajames.shapegame.ui.JanelaJogo;
import javax.swing.SwingUtilities;

public class Main {
    public static void main(String[] args) {
        // Criando o tabuleiro 5x5
        Tabuleiro tabuleiro = new Tabuleiro(5);

        SwingUtilities.invokeLater(() -> {
            JanelaJogo janela = new JanelaJogo(tabuleiro);
            janela.setVisible(true);
            System.out.println("=== JOGO INICIADO 5x5 ===");
        });
    }
}