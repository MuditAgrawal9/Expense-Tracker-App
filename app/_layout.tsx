import { AuthProvider } from "@/context/authContext";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const _layout = () => {
  return (
    <>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="(modals)/profileModal"
            options={{ presentation: "modal" }}
          ></Stack.Screen>
          <Stack.Screen
            name="(modals)/walletModal"
            options={{ presentation: "modal" }}
          ></Stack.Screen>
        </Stack>
      </AuthProvider>
    </>
  );
};

export default _layout;

const styles = StyleSheet.create({});
