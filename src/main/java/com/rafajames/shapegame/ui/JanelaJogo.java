package com.rafajames.shapegame.ui;

import com.rafajames.shapegame.model.*;
import com.rafajames.shapegame.service.GerenciadorJogo;
import javax.swing.*;
import java.awt.*;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class JanelaJogo extends JFrame {
    private Tabuleiro tabuleiro;
    private List<Peca> pecasNaReserva;
    private List<Peca> todasAsPecasDoNivelAtual;
    private Peca pecaSendoArrastada;
    private int mouseX, mouseY;
    
    private JButton btnProxima, btnAnterior, btnReset;
    private int indiceFaseAtual = 0;
    private List<File> listaDeFases;

    private final String PASTA_FASES = "C:\\Users\\e1215921\\Desktop\\ShapePuzzle\\src\\main\\resources\\fases";

    public JanelaJogo(Tabuleiro tabuleiro) {
        this.tabuleiro = tabuleiro;
        carregarListaDeFases();
        
        setTitle("Shape Puzzle - ADS Master Edition");
        setSize(560, 820);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        JPanel painelControle = new JPanel();
        painelControle.setBackground(new Color(30, 30, 40));
        
        btnAnterior = new JButton("⬅ Anterior");
        btnReset = new JButton("🔄 Reset");
        btnProxima = new JButton("Próxima ➡");
        
        btnAnterior.addActionListener(e -> mudarFase(-1));
        btnReset.addActionListener(e -> carregarFaseAtual());
        btnProxima.addActionListener(e -> mudarFase(1));

        painelControle.add(btnAnterior);
        painelControle.add(btnReset);
        painelControle.add(btnProxima);
        add(painelControle, BorderLayout.NORTH);

        carregarFaseAtual();

        PainelJogo painelVisual = new PainelJogo();
        add(painelVisual, BorderLayout.CENTER);
        
        MouseManager mouse = new MouseManager(tabuleiro, this);
        painelVisual.addMouseListener(mouse);
        painelVisual.addMouseMotionListener(mouse);
        addKeyListener(mouse);

        setResizable(false);
        setLocationRelativeTo(null);
        setFocusable(true);
    }

    private void carregarListaDeFases() {
        File pasta = new File(PASTA_FASES);
        if (!pasta.exists()) pasta.mkdirs();
        File[] arquivos = pasta.listFiles((dir, name) -> name.toLowerCase().endsWith(".txt"));
        if (arquivos != null && arquivos.length > 0) {
            listaDeFases = new ArrayList<>(Arrays.asList(arquivos));
            listaDeFases.sort((f1, f2) -> f1.getName().compareToIgnoreCase(f2.getName()));
        } else {
            listaDeFases = new ArrayList<>();
        }
    }

    private void carregarFaseAtual() {
        if (listaDeFases == null || listaDeFases.isEmpty()) return;
        File arquivoFase = listaDeFases.get(indiceFaseAtual);
        String caminho = arquivoFase.getAbsolutePath();
        tabuleiro.carregarFaseArquivo(caminho);
        this.todasAsPecasDoNivelAtual = GerenciadorJogo.carregarPecasDoArquivo(caminho);
        this.pecasNaReserva = new ArrayList<>(todasAsPecasDoNivelAtual);
        btnProxima.setEnabled(false);
        btnAnterior.setEnabled(indiceFaseAtual > 0);
        setTitle("Shape Puzzle | Fase " + (indiceFaseAtual + 1) + ": " + arquivoFase.getName());
        repaint();
    }

    private void mudarFase(int direcao) {
        int novoIndice = indiceFaseAtual + direcao;
        if (novoIndice >= 0 && novoIndice < listaDeFases.size()) {
            indiceFaseAtual = novoIndice;
            carregarFaseAtual();
            this.requestFocusInWindow();
        }
    }

    public void ativarBotaoNovaFase() {
        if (indiceFaseAtual < listaDeFases.size() - 1) {
            btnProxima.setEnabled(true);
            btnProxima.setBackground(new Color(0, 255, 127)); 
        } else {
            JOptionPane.showMessageDialog(this, "Incrível! Você dominou todas as formas!");
        }
    }

    public List<Peca> getTodasAsPecasDoNivelAtual() { return todasAsPecasDoNivelAtual; }
    public List<Peca> getReserva() { return pecasNaReserva; }
    public void removerPecaDaReserva(Peca p) { pecasNaReserva.remove(p); repaint(); }
    public void adicionarPecaAReserva(Peca p) { 
        if(p != null && !pecasNaReserva.contains(p)) {
            pecasNaReserva.add(p);
            repaint();
        } 
    }
    public void setPecaArrastada(Peca p) { this.pecaSendoArrastada = p; }
    public Peca getPecaArrastada() { return pecaSendoArrastada; }
    public void atualizarMouse(int x, int y) { this.mouseX = x; this.mouseY = y; }

    private class PainelJogo extends JPanel {
        public PainelJogo() { setBackground(new Color(12, 12, 18)); }
        
        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2d = (Graphics2D) g;
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            int TAM_CELULA = 60;
            int offX = (getWidth() - (5 * TAM_CELULA)) / 2;
            int offY = 30;

            // --- 1. DESENHO DO TABULEIRO ---
            for (int y = 0; y < 5; y++) {
                for (int x = 0; x < 5; x++) {
                    int px = offX + (x * TAM_CELULA);
                    int py = offY + (y * TAM_CELULA);
                    
                    g2d.setColor(new Color(30, 30, 45));
                    g2d.fillRect(px, py, TAM_CELULA, TAM_CELULA);
                    
                    // Desenha Estrela Guia
                    int estrela = tabuleiro.getGabarito()[y][x];
                    if (estrela != 0 && tabuleiro.getGrade()[y][x] == 0) {
                        g2d.setColor(getCorPorId(estrela));
                        g2d.fillOval(px + 20, py + 20, 20, 20);
                        g2d.setColor(new Color(255, 255, 255, 60));
                        g2d.drawOval(px + 20, py + 20, 20, 20);
                    }

                    // Desenha Peça no Tabuleiro (Preservando a Cor Real)
                    int idNoTabuleiro = tabuleiro.getGrade()[y][x];
                    if (idNoTabuleiro != 0) {
                        g2d.setColor(getCorPorId(idNoTabuleiro));
                        g2d.fillRoundRect(px + 3, py + 3, TAM_CELULA - 6, TAM_CELULA - 6, 10, 10);
                        g2d.setColor(new Color(0, 0, 0, 40));
                        g2d.drawRoundRect(px + 3, py + 3, TAM_CELULA - 6, TAM_CELULA - 6, 10, 10);
                    }
                    
                    g2d.setColor(new Color(50, 50, 70));
                    g2d.drawRect(px, py, TAM_CELULA, TAM_CELULA);
                }
            }

            // --- 2. DESENHO DA RESERVA ---
            int reservaY = 390;
            g2d.setColor(new Color(150, 150, 170));
            g2d.setFont(new Font("SansSerif", Font.BOLD, 13));
            g2d.drawString("📦 RESERVA (R: Girar | T: Flip | E: Remover)", 45, reservaY - 20);

            if (pecasNaReserva != null) {
                for (int k = 0; k < pecasNaReserva.size(); k++) {
                    Peca p = pecasNaReserva.get(k);
                    g2d.setColor(getCorPorId(p.getId()));
                    
                    int col = k % 4; 
                    int lin = k / 4;
                    int xBase = 50 + (col * 125); 
                    int yBase = reservaY + (lin * 95);

                    int[][] f = p.getFormato();
                    int mini = 18;
                    for (int i = 0; i < f.length; i++) {
                        for (int j = 0; j < f[0].length; j++) {
                            if (f[i][j] != 0) {
                                g2d.fillRoundRect(xBase + (j * (mini + 2)), 
                                                  yBase + (i * (mini + 2)), 
                                                  mini, mini, 5, 5);
                            }
                        }
                    }
                }
            }

            // --- 3. PEÇA SENDO ARRASTADA ---
            if (pecaSendoArrastada != null) {
                g2d.setColor(getCorPorId(pecaSendoArrastada.getId()));
                int[][] f = pecaSendoArrastada.getFormato();
                for (int i = 0; i < f.length; i++) {
                    for (int j = 0; j < f[0].length; j++) {
                        if (f[i][j] != 0) {
                            int drawX = mouseX + (j * TAM_CELULA) - (TAM_CELULA / 2);
                            int drawY = mouseY + (i * TAM_CELULA) - (TAM_CELULA / 2);
                            g2d.fillRoundRect(drawX, drawY, TAM_CELULA - 4, TAM_CELULA - 4, 12, 12);
                            g2d.setColor(new Color(255, 255, 255, 100));
                            g2d.drawRoundRect(drawX, drawY, TAM_CELULA - 4, TAM_CELULA - 4, 12, 12);
                            g2d.setColor(getCorPorId(pecaSendoArrastada.getId()));
                        }
                    }
                }
            }
        }
    }

    private Color getCorPorId(int idNoTabuleiro) {
        int idReal = idNoTabuleiro;

        // SE o ID for uma instância colocada (>= 1000), buscamos o ID original no Tabuleiro
        if (idNoTabuleiro >= 1000) {
            Peca p = tabuleiro.getMapaPecasColocadas().get(idNoTabuleiro);
            if (p != null) {
                idReal = p.getId(); // Retorna o 1, 6, 11 ou 16 original
            }
        }

        switch(idReal) {
            case 1:  return new Color(0, 190, 255);  // Azul
            case 6:  return new Color(40, 230, 40);  // Verde
            case 11: return new Color(255, 50, 150); // Rosa
            case 16: return new Color(255, 200, 0);  // Amarelo
            default: return new Color(120, 120, 135); 
        }
    }
}