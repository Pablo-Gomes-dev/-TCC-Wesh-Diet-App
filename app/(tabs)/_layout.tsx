// ==============================================================================
// LAYOUT DAS ABAS INFERIORES (BOTTOM TABS) - WESHDIET
// ==============================================================================
// Este arquivo configura a barra de navegação por abas inferiores do aplicativo,
// definindo ícones, títulos e rotas ativas (Home e Pacientes).
// ==============================================================================

import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* ABA 1: TELA INICIAL (HOME) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* ABA 2: PAINEL DE GESTÃO DE PACIENTES */}
      <Tabs.Screen
        name="Pacientes"
        options={{
          title: "Pacientes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
