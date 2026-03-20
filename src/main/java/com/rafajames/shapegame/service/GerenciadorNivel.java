package com.rafajames.shapegame.service;

public class GerenciadorNivel {
    private int estrelasDesbloqueadas = 1;
    private int nivelAtual = 1;

    public void completarNivel() {
        nivelAtual++;
        // Ganha uma estrela a cada 5 níveis completados
        if (nivelAtual % 5 == 0) {
            estrelasDesbloqueadas++;
        }
    }

    public int getEstrelasDesbloqueadas() { return estrelasDesbloqueadas; }
    public int getNivelAtual() { return nivelAtual; }
}