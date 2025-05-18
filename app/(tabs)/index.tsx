import Button from "@/components/Button";
import Typo from "@/components/Typo";
import { auth } from "@/config/firebase";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Home = () => {
  const { user } = useAuth();
  console.log("(Tab index)User:", user);
  const { name, email } = user || {};
  // console.log("(Tab index)Name:", name);
  // console.log("(Tab index)Email:", email);
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <View>
      <Text>Home</Text>
      <Button onPress={handleLogout}>
        <Typo color={colors.black}>Log Out</Typo>
      </Button>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({});
