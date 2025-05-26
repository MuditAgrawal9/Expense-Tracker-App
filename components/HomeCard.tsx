import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import useFetchData from "@/hooks/useFetchData";
import { WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { orderBy, where } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import Typo from "./Typo";

/**
 * HomeCard displays the user's total balance, income, and expenses
 * in a styled card with a background image.
 */
const HomeCard = () => {
  const { user } = useAuth();

  const {
    data: wallets,
    error,
    loading: walletLoading,
  } = useFetchData<WalletType>("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);
  // Function to calculate total balance, income, and expenses from wallets
  const getWalletTotals = () => {
    return wallets.reduce(
      (totals, item) => {
        totals.balance += item?.amount || 0;
        totals.income += item?.totalIncome || 0;
        totals.expense += item?.totalExpenses || 0;
        return totals;
      },
      { balance: 0, income: 0, expense: 0 }
    );
  };
  return (
    // Card background image
    <ImageBackground
      source={require("../assets/images/card.png")}
      resizeMode="stretch"
      style={styles.bgImage}
    >
      <View style={styles.container}>
        {/* Top section: Total Balance and options icon */}
        <View>
          <View style={styles.totalBalanceRow}>
            <Typo color={colors.neutral800} size={17} fontWeight={500}>
              Total Balance
            </Typo>

            <Icons.DotsThreeOutline
              size={verticalScale(23)}
              color={colors.black}
              weight="fill"
            />
          </View>
          {/* Total balance amount */}
          <Typo color={colors.black} size={30} fontWeight={"bold"}>
            ${walletLoading ? "----" : getWalletTotals().balance?.toFixed(2)}
          </Typo>
        </View>
        {/* Bottom section: Income and Expenses */}
        <View style={styles.stats}>
          {/* Income block */}
          <View style={{ gap: verticalScale(5) }}>
            <View style={styles.incomeExpense}>
              <View style={styles.statsIcon}>
                <Icons.ArrowDown
                  size={verticalScale(15)}
                  color={colors.black}
                  weight="bold"
                />
              </View>
              <Typo color={colors.neutral700} size={16} fontWeight={500}>
                Income
              </Typo>
            </View>
            <View style={{ alignSelf: "center" }}>
              <Typo color={colors.green} size={17} fontWeight={600}>
                ${walletLoading ? "----" : getWalletTotals().income?.toFixed(2)}
              </Typo>
            </View>
          </View>
          {/* Expenses block */}
          <View style={{ gap: verticalScale(5) }}>
            <View style={styles.incomeExpense}>
              <View style={styles.statsIcon}>
                <Icons.ArrowUp
                  size={verticalScale(15)}
                  color={colors.black}
                  weight="bold"
                />
              </View>
              <Typo color={colors.neutral700} size={16} fontWeight={500}>
                Expense
              </Typo>
            </View>
            <View style={{ alignSelf: "center" }}>
              <Typo color={colors.rose} size={17} fontWeight={600}>
                $
                {walletLoading ? "----" : getWalletTotals().expense?.toFixed(2)}
              </Typo>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default HomeCard;

const styles = StyleSheet.create({
  bgImage: {
    height: scale(210),
    width: "100%",
  },
  container: {
    padding: spacingX._20,
    paddingHorizontal: scale(23),
    height: "87%",
    width: "100%",
    justifyContent: "space-between",
  },
  totalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsIcon: {
    backgroundColor: colors.neutral350,
    padding: spacingX._5,
    borderRadius: 50,
  },
  incomeExpense: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingY._7,
  },
});
