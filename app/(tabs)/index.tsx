import Button from "@/components/Button";
import HomeCard from "@/components/HomeCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import TransactionList from "@/components/TransactionList";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import useFetchData from "@/hooks/useFetchData";
import { TransactionType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import { limit, orderBy, where } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

/**
 * Home screen component showing user greeting, balance card, recent transactions, and add button.
 */
const Home = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Fetch recent transactions for the user, limited to 30 most recent
  const constraints = [
    where("uid", "==", user?.uid),
    orderBy("date", "desc"),
    limit(30),
  ];
  const {
    data: recentTransactions,
    error,
    loading: transactionLoadind,
  } = useFetchData<TransactionType>("transactions", constraints);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header section with greeting and search icon */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>
              Hello,
            </Typo>
            <Typo>{user?.name}</Typo>
          </View>

          <TouchableOpacity
            style={styles.searchIcon}
            onPress={() => router.push("/(modals)/searchModal")}
          >
            <Icons.MagnifyingGlass
              color={colors.neutral200}
              size={verticalScale(22)}
              weight="bold"
            />
          </TouchableOpacity>
        </View>
        {/* Main scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance card */}
          <View>
            <HomeCard />
          </View>
          {/* Recent transactions list */}
          <TransactionList
            data={recentTransactions}
            loading={transactionLoadind}
            title="Recent Transactions "
            emptyListMessage="No Transactions added yet!"
          />
        </ScrollView>
        {/* Floating action button to add a new transaction */}
        <Button
          style={styles.floatingButton}
          onPress={() => router.push("/(modals)/transactionModal")}
        >
          <Icons.Plus
            color={colors.black}
            weight="bold"
            size={verticalScale(24)}
          />
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingX._10,
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
  scrollViewStyle: {
    marginTop: spacingX._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25,
  },
});
