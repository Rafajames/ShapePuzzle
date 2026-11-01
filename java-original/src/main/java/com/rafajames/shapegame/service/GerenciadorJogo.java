package com.rafajames.shapegame.service;

import com.rafajames.shapegame.model.Peca;
import java.io.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GerenciadorJogo {

    public static List<Peca> carregarPecasDoArquivo(String caminho) {
        List<Peca> pecas = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(caminho))) {
            String linha;
            boolean lendoCustom = false;

            while ((linha = br.readLine()) != null) {
                linha = linha.trim();
                if (linha.isEmpty()) continue;

                if (linha.equals("PECAS_CUSTOM:")) {
                    lendoCustom = true;
                    continue;
                }

                if (lendoCustom && linha.contains(":")) {
                    try {
                        String[] partes = linha.split(":");
                        int id = Integer.parseInt(partes[0].trim());
                        int[][] matriz = reconstruirMatriz(partes[1].trim());
                        pecas.add(new Peca(id, matriz));
                    } catch (Exception e) {
                        System.err.println("Erro ao processar linha de peça: " + linha);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Erro ao abrir arquivo: " + e.getMessage());
        }
        return pecas;
    }

    private static int[][] reconstruirMatriz(String dados) {
        List<int[]> coordenadas = new ArrayList<>();
        
        // O Regex captura números negativos corretamente
        Pattern p = Pattern.compile("-?\\d+");
        Matcher m = p.matcher(dados);

        // Iniciamos com valores extremos para encontrar o "canto superior esquerdo" da peça
        int minX = Integer.MAX_VALUE, maxX = Integer.MIN_VALUE;
        int minY = Integer.MAX_VALUE, maxY = Integer.MIN_VALUE;

        // 1. Extração dos Pontos
        while (m.find()) {
            int x = Integer.parseInt(m.group()); // Primeiro número é X (Coluna)
            if (m.find()) {
                int y = Integer.parseInt(m.group()); // Segundo número é Y (Linha)
                
                coordenadas.add(new int[]{x, y});
                
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
        }

        // 2. Cálculo do Tamanho (Evita inversão de largura por altura)
        int largura = maxX - minX + 1;
        int altura = maxY - minY + 1;
        
        // A matriz em Java é [LINHAS][COLUNAS], logo [ALTURA][LARGURA]
        int[][] matriz = new int[altura][largura];

        // 3. Preenchimento e Normalização
        for (int[] coord : coordenadas) {
            // Normalizamos para que o menor valor de X e Y vire a posição 0,0 na matriz local
            int finalX = coord[0] - minX; 
            int finalY = coord[1] - minY;
            
            // ATENÇÃO: matriz[Linha][Coluna] -> matriz[Y][X]
            // Inverter isso aqui faz a peça aparecer rotacionada/espelhada
            matriz[finalY][finalX] = 1;
        }
        
        return matriz;
    }
}