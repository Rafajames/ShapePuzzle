package com.rafajames.shapegame.model;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

public class Tabuleiro {
    private int[][] grade;
    private int[][] gabarito;
    private int tamanho = 5;
    
    // Mapeia o ID Único gerado para a Peça original (para devolver à reserva e identificar cores)
    private Map<Integer, Peca> mapaPecasColocadas = new HashMap<>();
    private int contadorIdUnico = 1000; 

    public Tabuleiro(int tamanho) {
        this.tamanho = tamanho;
        this.grade = new int[tamanho][tamanho];
        this.gabarito = new int[tamanho][tamanho];
    }

    // --- MÉTODOS DE ACESSO (GETTERS) ---
    public int[][] getGrade() { return grade; }
    public int[][] getGabarito() { return gabarito; }
    
    /**
     * Getter necessário para que a JanelaJogo consulte a cor real da peça
     * através do ID único gerado no tabuleiro.
     */
    public Map<Integer, Peca> getMapaPecasColocadas() {
        return mapaPecasColocadas;
    }

    public void carregarFaseArquivo(String caminho) {
        mapaPecasColocadas.clear();
        contadorIdUnico = 1000;
        for (int i = 0; i < tamanho; i++) {
            for (int j = 0; j < tamanho; j++) {
                grade[i][j] = 0;
                gabarito[i][j] = 0;
            }
        }

        try (BufferedReader br = new BufferedReader(new FileReader(caminho))) {
            String linha;
            boolean lendoGabarito = false;
            int y = 0;
            while ((linha = br.readLine()) != null) {
                linha = linha.trim();
                if (linha.equalsIgnoreCase("GABARITO:")) { lendoGabarito = true; y = 0; continue; }
                if (linha.toUpperCase().startsWith("PECAS")) { lendoGabarito = false; continue; }
                if (lendoGabarito && y < tamanho) {
                    String[] valores = linha.split(",");
                    for (int x = 0; x < Math.min(valores.length, tamanho); x++) {
                        gabarito[y][x] = Integer.parseInt(valores[x].trim());
                    }
                    y++;
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
    }

    public boolean isNivelConcluido() {
        for (int y = 0; y < tamanho; y++) {
            for (int x = 0; x < tamanho; x++) {
                int corEstrela = gabarito[y][x];
                
                if (corEstrela != 0) {
                    int idNaGrade = grade[y][x];
                    if (idNaGrade == 0) return false;

                    Peca p = mapaPecasColocadas.get(idNaGrade);
                    // Valida se a cor da peça que cobre a estrela é a correta
                    if (p != null && p.getId() != corEstrela) return false;
                }
                
                if (grade[y][x] == 0) return false;
            }
        }
        return true; 
    }

    public boolean podeColocarPeca(int[][] formato, int posX, int posY) {
        for (int i = 0; i < formato.length; i++) {
            for (int j = 0; j < formato[0].length; j++) {
                if (formato[i][j] != 0) {
                    int ax = posX + j;
                    int ay = posY + i;
                    if (ax < 0 || ax >= tamanho || ay < 0 || ay >= tamanho || grade[ay][ax] != 0) return false;
                }
            }
        }
        return true;
    }

    public void colocarPeca(Peca p, int posX, int posY) {
        int idUnico = contadorIdUnico++;
        mapaPecasColocadas.put(idUnico, p);
        
        int[][] formato = p.getFormato();
        for (int i = 0; i < formato.length; i++) {
            for (int j = 0; j < formato[0].length; j++) {
                if (formato[i][j] != 0) grade[posY + i][posX + j] = idUnico;
            }
        }
    }

    public Peca removerPecaPelaPosicao(int x, int y) {
        int idUnico = grade[y][x];
        if (idUnico >= 1000) {
            Peca p = mapaPecasColocadas.remove(idUnico);
            for (int i = 0; i < tamanho; i++) {
                for (int j = 0; j < tamanho; j++) {
                    if (grade[i][j] == idUnico) grade[i][j] = 0;
                }
            }
            return p;
        }
        return null;
    }
}