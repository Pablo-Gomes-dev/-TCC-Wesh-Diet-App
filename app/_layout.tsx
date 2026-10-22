// ==============================================================================
// LAYOUT RAIZ DE NAVEGAÇÃO (STACK) - WESHDIET
// ==============================================================================
// Este arquivo configura a pilha de navegação principal (Stack) do Expo Router,
// o tema visual (claro/escuro) e a barra de status do aplicativo.
// ==============================================================================

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

// CONFIGURAÇÃO DE ANCORAGEM INICIAL PARA O GRUPO DE ABAS
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* GRUPO PRINCIPAL DE ABAS INFERIORES */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* TELA DE AUTENTICAÇÃO / LOGIN */}
        <Stack.Screen name="login" options={{ title: "Login" }} />

        {/* TELA DE CADASTRO DE USUÁRIOS */}
        <Stack.Screen name="cadastro" options={{ title: "Criar Conta" }} />


        {/* TELA DE PAINEL RESUMO / HOME */}
        <Stack.Screen name="home" options={{ title: "Home" }} />

        {/* ROTAS ADICIONAIS REGISTRADAS NO STACK */}
        <Stack.Screen
          name="plano-alimentar"
          options={{ title: "Plano Alimentar" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
