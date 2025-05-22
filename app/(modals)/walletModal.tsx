import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import { createOrUpdateWallet } from "@/services/walletService";
import { WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const WalletModal = () => {
  const router = useRouter();
  // Auth context to get current user and update function
  const { user, updateUserData } = useAuth();
  const [loading, setloading] = useState(false);

  // Local state for wallet form data
  const [wallet, setWallet] = useState<WalletType>({
    name: "",
    image: null,
  });

  // Handler for form submission
  const onSubmit = async () => {
    const { name, image } = wallet;

    // Validation: Ensure both fields are filled
    if (!name.trim() || !image) {
      Alert.alert("Wallet", "Please fill all the fields");
      return;
    }

    // Prevent submission if no changes were made
    // if (name === wallet?.name && image === wallet?.image) {
    //   Alert.alert("Wallet", "Name and Image same as before");
    //   return;
    // }

    // Prepare data for API calls
    const data: WalletType = {
      name,
      image,
      uid: user?.uid,
    };
    //todo : include wallet id if updating

    setloading(true); // Show loading indicator

    // API call to create or update wallet
    const res = await createOrUpdateWallet(data);

    setloading(false); // Hide loading indicator
    console.log("(walletModal) resul:", res);

    // Show feedback based on API response
    if (res.success) {
      Alert.alert("Wallet", res.msg);
      router.back();
    } else {
      Alert.alert("Wallet", res.msg);
    }
  };

  return (
    // Modal wrapper for consistent modal styling
    <ModalWrapper>
      <View style={styles.container}>
        {/* Header with back button and title */}
        <Header
          title="New Wallet"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._15 }}
        />

        {/* form */}
        <ScrollView contentContainerStyle={styles.form}>
          {/* Form section */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Name</Typo>
            <Input
              placeholder="Salary"
              value={wallet.name}
              onChangeText={(value) => setWallet({ ...wallet, name: value })}
            />
          </View>
          {/* Wallet Icon/Image Input */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Icon</Typo>
            <ImageUpload
              placeholder="Upload Image"
              file={wallet.image}
              onSelect={(file) => setWallet({ ...wallet, image: file })}
              onClear={() => setWallet({ ...wallet, image: null })}
            />
          </View>
        </ScrollView>
      </View>
      {/* Footer with submit button */}
      <View style={styles.footer}>
        <Button style={{ flex: 1 }} onPress={onSubmit} loading={loading}>
          <Typo color={colors.black} fontWeight={700}>
            Update
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default WalletModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingX._20,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginBottom: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
