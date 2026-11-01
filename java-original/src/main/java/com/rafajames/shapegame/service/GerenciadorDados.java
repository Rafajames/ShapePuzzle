package com.rafajames.shapegame.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.*;

public class GerenciadorDados {
    private static final String NOME_ARQUIVO = "savegame.json";
    private Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public void salvarProgresso(GerenciadorNivel gerenciador) {
        try (Writer writer = new FileWriter(NOME_ARQUIVO)) {
            gson.toJson(gerenciador, writer);
        } catch (IOException e) {
            System.err.println("Erro ao salvar: " + e.getMessage());
        }
    }

    public GerenciadorNivel carregarProgresso() {
        File arquivo = new File(NOME_ARQUIVO);
        if (!arquivo.exists()) return new GerenciadorNivel();

        try (Reader reader = new FileReader(NOME_ARQUIVO)) {
            return gson.fromJson(reader, GerenciadorNivel.class);
        } catch (IOException e) {
            return new GerenciadorNivel();
        }
    }
}