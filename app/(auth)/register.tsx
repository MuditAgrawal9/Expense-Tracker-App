import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

const Register = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const router = useRouter();
  const nameRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();

  const handleSubmit = async () => {
    if (!nameRef.current || !emailRef.current || !passwordRef.current) {
      Alert.alert("Sign Up", "Please fill in all fields");
      return;
    }
    setIsLoading(true);
    // register
    const res = await registerUser(
      nameRef.current,
      emailRef.current,
      passwordRef.current
    );
    setIsLoading(false);
    // check if success
    console.log("Register result:", res);
    if (!res.success) {
      Alert.alert("Sign Up", res.msg);
      return;
    }
    if (res.success) {
      Alert.alert("Sign Up", "Account created successfully");
      // router.replace("/(auth)/login");
      return;
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"}>
            Let&apos;s
          </Typo>
          <Typo size={30} fontWeight={"800"}>
            Get Started
          </Typo>

          {/* form */}

          <View style={styles.form}>
            <Typo size={16} color={colors.textLighter}>
              Create an account to track all your expenses
            </Typo>
            <Input
              placeholder="Enter your Name"
              onChangeText={(value) => (nameRef.current = value)}
              icon={
                <Icons.User
                  size={verticalScale(26)}
                  color={colors.neutral400}
                  weight="fill"
                />
              }
            />
            <Input
              placeholder="Enter your email"
              onChangeText={(value) => (emailRef.current = value)}
              icon={
                <Icons.At
                  size={verticalScale(26)}
                  color={colors.neutral400}
                  weight="fill"
                />
              }
            />
            <Input
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={(value) => (passwordRef.current = value)}
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral400}
                  weight="fill"
                />
              }
            />
            {/* <Typo
              size={14}
              color={colors.text}
              style={{ alignSelf: "flex-end" }}
            >
              Forgot Password?
            </Typo> */}

            <Button loading={isLoading} onPress={handleSubmit}>
              <Typo size={21} color={colors.black} fontWeight={"700"}>
                Sign Up
              </Typo>
            </Button>
          </View>

          {/* footer */}

          <View style={styles.footer}>
            <Typo size={15}>Already have an account?</Typo>
            <Pressable onPress={() => router.navigate("/(auth)/login")}>
              <Typo size={16} color={colors.primary} fontWeight={"700"}>
                Login
              </Typo>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
    marginTop: spacingY._20,
  },
  forgotPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: spacingY._20,
  },
  footerText: {
    textAlign: "center",
    fontSize: verticalScale(15),
    color: colors.text,
  },
});
