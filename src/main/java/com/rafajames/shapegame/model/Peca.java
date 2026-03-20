package com.rafajames.shapegame.model;

public class Peca {
    private int id; 
    private int[][] formato;

    public Peca(int id, int[][] formato) {
        this.id = id;
        // Usamos o clone para garantir que cada peça seja única na memória
        this.formato = clonarMatriz(formato);
    }

    /**
     * Gira a matriz 90 graus no sentido horário.
     * Algoritmo de ADS: Transposta + Inversão de Colunas.
     */
    public void girar() {
        int linhas = formato.length;
        int colunas = formato[0].length;
        int[][] novo = new int[colunas][linhas];

        for (int i = 0; i < linhas; i++) {
            for (int j = 0; j < colunas; j++) {
                // Mapeamento para rotação 90°: a linha vira coluna e a coluna inverte
                novo[j][linhas - 1 - i] = formato[i][j];
            }
        }
        this.formato = novo;
    }

    /**
     * Inverte a matriz horizontalmente (Flip).
     * Essencial para peças assimétricas que não encaixam apenas com rotação.
     */
    public void inverter() {
        int linhas = formato.length;
        int colunas = formato[0].length;
        int[][] novoFormato = new int[linhas][colunas];

        for (int i = 0; i < linhas; i++) {
            for (int j = 0; j < colunas; j++) {
                // Inverte a coluna: a primeira vira a última (espelhamento)
                novoFormato[i][colunas - 1 - j] = formato[i][j];
            }
        }
        this.formato = novoFormato;
    }

    /**
     * Cria uma cópia profunda da matriz para evitar que alterações em uma peça
     * afetem outras instâncias do mesmo tipo.
     */
    private int[][] clonarMatriz(int[][] original) {
        if (original == null) return null;
        int[][] copia = new int[original.length][original[0].length];
        for (int i = 0; i < original.length; i++) {
            System.arraycopy(original[i], 0, copia[i], 0, original[i].length);
        }
        return copia;
    }

    // Getters
    public int getId() { return id; }
    public int[][] getFormato() { return formato; }
    
    // Setters
    public void setFormato(int[][] formato) { this.formato = formato; }
}