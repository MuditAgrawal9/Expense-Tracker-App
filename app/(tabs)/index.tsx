import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { useAuth } from "@/context/authContext";
import React from "react";
import { StyleSheet } from "react-native";

const Home = () => {
  const { user } = useAuth();
  console.log("(Tab index)User:", user);
  return (
    <ScreenWrapper>
      <Typo>Home</Typo>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({});
