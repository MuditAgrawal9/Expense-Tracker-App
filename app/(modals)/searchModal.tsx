import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import TransactionList from "@/components/TransactionList";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/context/authContext";
import useFetchData from "@/hooks/useFetchData";
import { TransactionType } from "@/types";
import { useRouter } from "expo-router";
import { orderBy, where } from "firebase/firestore";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

// SearchModal component allows the user to search transactions by keyword
const SearchModal = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setloading] = useState(false);
  const [search, setSearch] = useState("");

  // Firestore query constraints: only transactions for this user, ordered by date (newest first)
  const constraints = [where("uid", "==", user?.uid), orderBy("date", "desc")];

  // Fetch all transactions matching the constraints using a custom hook
  const {
    data: allTransactions,
    error,
    loading: transactionLoadind,
  } = useFetchData<TransactionType>("transactions", constraints);

  // Filter transactions based on search input
  const filteredTransactions = allTransactions?.filter((item) => {
    if (search.length > 1) {
      // Check if category, description, or type contains the search string (case-insensitive)
      if (
        item?.category?.toLowerCase().includes(search.toLowerCase()) ||
        item?.description?.toLowerCase().includes(search.toLowerCase()) ||
        item?.type?.toLowerCase().includes(search.toLowerCase())
      ) {
        return true;
      }
      return false; // Exclude items that do not match the search criteria
    }
    return true; // Return all items if search is empty or less than 2 characters
  });
  return (
    // Modal wrapper for consistent modal styling
    <ModalWrapper style={{ backgroundColor: colors.neutral900 }}>
      <View style={styles.container}>
        {/* Header with back button and title */}
        <Header
          title={"Search"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._15 }}
        />

        {/* Scrollable form area */}
        <ScrollView contentContainerStyle={styles.form}>
          {/* Search input field */}
          <View style={styles.inputContainer}>
            <Input
              placeholder="shoes, groceries, etc."
              placeholderTextColor={colors.neutral400}
              value={search}
              onChangeText={(value) => setSearch(value)}
              containerStyle={{ backgroundColor: colors.neutral800 }}
            />
          </View>

          {/* Filtered transaction list */}
          <View>
            <TransactionList
              data={filteredTransactions}
              loading={transactionLoadind}
              emptyListMessage="No transactions matches your search"
            />
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default SearchModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingX._20,
  },

  form: {
    gap: spacingY._30,
    marginBottom: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
