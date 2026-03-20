package com.rafajames.shapegame.ui;

import javax.swing.*;
import java.awt.*;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class EditorFases extends JFrame {
    private int[][] novoGabarito = new int[5][5];
    private int corSelecionada = 1; 
    private JButton[][] botoesGrid = new JButton[5][5];
    private JComboBox<String> comboDificuldade;
    
    private final String CAMINHO_DESTINO = "C:\\Users\\e1215921\\Desktop\\ShapePuzzle\\src\\main\\resources\\fases";

    public EditorFases() {
        setTitle("Editor Shape Puzzle - ADS Master Edition");
        setSize(850, 650);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setLayout(new BorderLayout());
        getContentPane().setBackground(new Color(25, 25, 30));

        // 1. Grid de Desenho 5x5
        JPanel painelGrid = new JPanel(new GridLayout(5, 5, 3, 3));
        painelGrid.setBackground(new Color(15, 15, 20));
        painelGrid.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        for (int y = 0; y < 5; y++) {
            for (int x = 0; x < 5; x++) {
                final int fy = y;
                final int fx = x;
                botoesGrid[y][x] = new JButton();
                botoesGrid[y][x].setBackground(new Color(45, 45, 50));
                botoesGrid[y][x].setBorder(BorderFactory.createLineBorder(Color.DARK_GRAY));
                botoesGrid[y][x].setOpaque(true);
                
                botoesGrid[y][x].addActionListener(e -> {
                    novoGabarito[fy][fx] = (novoGabarito[fy][fx] == 0) ? corSelecionada : 0;
                    atualizarCorBotao(botoesGrid[fy][fx], novoGabarito[fy][fx]);
                });
                painelGrid.add(botoesGrid[y][x]);
            }
        }

        // 2. Painel de Ferramentas
        JPanel lateral = new JPanel();
        lateral.setLayout(new BoxLayout(lateral, BoxLayout.Y_AXIS));
        lateral.setBackground(new Color(35, 35, 40));
        lateral.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        // Combo de Cores
        String[] cores = {"AZUL", "VERDE", "ROSA", "AMARELO"};
        JComboBox<String> comboCores = new JComboBox<>(cores);
        comboCores.setMaximumSize(new Dimension(200, 30));
        comboCores.addActionListener(e -> {
            int sel = comboCores.getSelectedIndex();
            if(sel == 0) corSelecionada = 1;
            else if(sel == 1) corSelecionada = 6;
            else if(sel == 2) corSelecionada = 11;
            else if(sel == 3) corSelecionada = 16;
        });

        // Combo de Dificuldade
        String[] dificuldades = {"Fácil (Tudo)", "Médio (Início/Fim)", "Difícil (1 Estrela)"};
        comboDificuldade = new JComboBox<>(dificuldades);
        comboDificuldade.setMaximumSize(new Dimension(200, 30));

        JButton btnSalvar = new JButton("💾 SALVAR FASE");
        btnSalvar.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnSalvar.setBackground(new Color(0, 120, 215));
        btnSalvar.setForeground(Color.WHITE);
        btnSalvar.addActionListener(e -> salvarFase());

        JButton btnLimpar = new JButton("✨ LIMPAR TELA");
        btnLimpar.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnLimpar.addActionListener(e -> limparGrid());

        // Adicionando componentes à lateral
        lateral.add(new JLabel("<html><font color='white'>Cor do Bloco:</font></html>"));
        lateral.add(Box.createVerticalStrut(5));
        lateral.add(comboCores);
        lateral.add(Box.createVerticalStrut(20));
        
        lateral.add(new JLabel("<html><font color='white'>Dificuldade do Gabarito:</font></html>"));
        lateral.add(Box.createVerticalStrut(5));
        lateral.add(comboDificuldade);
        lateral.add(Box.createVerticalStrut(40));
        
        lateral.add(btnSalvar);
        lateral.add(Box.createVerticalStrut(10));
        lateral.add(btnLimpar);

        add(painelGrid, BorderLayout.CENTER);
        add(lateral, BorderLayout.EAST);
        
        setLocationRelativeTo(null);
    }

    private void salvarFase() {
        String nome = JOptionPane.showInputDialog(this, "Nome da fase:");
        if (nome == null || nome.trim().isEmpty()) return;

        int dificuldadeSel = comboDificuldade.getSelectedIndex();

        try (PrintWriter writer = new PrintWriter(new FileWriter(new File(CAMINHO_DESTINO, nome + ".txt")))) {
            writer.println("GABARITO:");
            boolean[][] visitadoGabarito = new boolean[5][5];
            
            for (int y = 0; y < 5; y++) {
                StringBuilder linhaTxt = new StringBuilder();
                for (int x = 0; x < 5; x++) {
                    int cor = novoGabarito[y][x];
                    
                    if (cor != 0 && !visitadoGabarito[y][x]) {
                        if (dificuldadeSel == 0) { // FÁCIL: Salva tudo
                             linhaTxt.append(cor);
                        } else {
                            // Mapeia os pontos da peça atual para decidir quais estrelas salvar
                            List<Point> pontosPeca = new ArrayList<>();
                            obterPontosConectados(x, y, cor, new boolean[5][5], pontosPeca);
                            
                            if (dificuldadeSel == 2) { // DIFÍCIL: Apenas a primeira
                                if (x == pontosPeca.get(0).x && y == pontosPeca.get(0).y) {
                                    linhaTxt.append(cor);
                                } else {
                                    linhaTxt.append("0");
                                }
                            } else if (dificuldadeSel == 1) { // MÉDIO: Primeira e Última
                                Point primeira = pontosPeca.get(0);
                                Point ultima = pontosPeca.get(pontosPeca.size() - 1);
                                if ((x == primeira.x && y == primeira.y) || (x == ultima.x && y == ultima.y)) {
                                    linhaTxt.append(cor);
                                } else {
                                    linhaTxt.append("0");
                                }
                            }
                            // Marca a peça como visitada para não reprocessar no loop do gabarito
                            marcarTodaPecaComoVisitada(x, y, cor, visitadoGabarito);
                        }
                    } else if (cor != 0 && dificuldadeSel == 0) {
                        linhaTxt.append(cor);
                    } else {
                        linhaTxt.append("0");
                    }
                    linhaTxt.append(x < 4 ? "," : "");
                }
                writer.println(linhaTxt.toString());
            }

            writer.println("PECAS_CUSTOM:");
            boolean[][] visitadoPecas = new boolean[5][5];
            for (int y = 0; y < 5; y++) {
                for (int x = 0; x < 5; x++) {
                    if (novoGabarito[y][x] != 0 && !visitadoPecas[y][x]) {
                        int cor = novoGabarito[y][x];
                        StringBuilder sb = new StringBuilder();
                        mapearPeca(x, y, x, y, visitadoPecas, cor, sb);
                        writer.println(cor + ":" + sb.toString());
                    }
                }
            }
            JOptionPane.showMessageDialog(this, "Fase salva com sucesso!");
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Erro: " + e.getMessage());
        }
    }

    // Auxiliar para pegar todos os pontos de uma peça e facilitar o cálculo de Médio/Difícil
    private void obterPontosConectados(int x, int y, int cor, boolean[][] visLocal, List<Point> pontos) {
        if (x < 0 || x >= 5 || y < 0 || y >= 5 || visLocal[y][x] || novoGabarito[y][x] != cor) return;
        visLocal[y][x] = true;
        pontos.add(new Point(x, y));
        obterPontosConectados(x + 1, y, cor, visLocal, pontos);
        obterPontosConectados(x - 1, y, cor, visLocal, pontos);
        obterPontosConectados(x, y + 1, cor, visLocal, pontos);
        obterPontosConectados(x, y - 1, cor, visLocal, pontos);
    }

    private void marcarTodaPecaComoVisitada(int x, int y, int cor, boolean[][] vis) {
        if (x < 0 || x >= 5 || y < 0 || y >= 5 || vis[y][x] || novoGabarito[y][x] != cor) return;
        vis[y][x] = true;
        marcarTodaPecaComoVisitada(x + 1, y, cor, vis);
        marcarTodaPecaComoVisitada(x - 1, y, cor, vis);
        marcarTodaPecaComoVisitada(x, y + 1, cor, vis);
        marcarTodaPecaComoVisitada(x, y - 1, cor, vis);
    }

    private void mapearPeca(int x, int y, int ox, int oy, boolean[][] vis, int cor, StringBuilder sb) {
        if (x < 0 || x >= 5 || y < 0 || y >= 5 || vis[y][x] || novoGabarito[y][x] != cor) return;
        vis[y][x] = true;
        sb.append(x - ox).append("-").append(y - oy).append(";");
        mapearPeca(x + 1, y, ox, oy, vis, cor, sb);
        mapearPeca(x - 1, y, ox, oy, vis, cor, sb);
        mapearPeca(x, y + 1, ox, oy, vis, cor, sb);
        mapearPeca(x, y - 1, ox, oy, vis, cor, sb);
    }

    private void atualizarCorBotao(JButton b, int id) {
        if (id == 1) b.setBackground(new Color(0, 180, 255));
        else if (id == 6) b.setBackground(new Color(50, 220, 50));
        else if (id == 11) b.setBackground(new Color(255, 60, 160));
        else if (id == 16) b.setBackground(new Color(255, 210, 0));
        else b.setBackground(new Color(45, 45, 50));
    }

    private void limparGrid() {
        for (int y = 0; y < 5; y++) {
            for (int x = 0; x < 5; x++) {
                novoGabarito[y][x] = 0;
                botoesGrid[y][x].setBackground(new Color(45, 45, 50));
            }
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new EditorFases().setVisible(true));
    }
}