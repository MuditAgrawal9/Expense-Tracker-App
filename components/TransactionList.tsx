import { expenseCategories } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { TransactionItemProps, TransactionListType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loading from "./Loading";
import Typo from "./Typo";

/**
 * TransactionList displays a list of transactions with optional title, loading state, and empty message.
 * @param {TransactionListType} props - Props containing data, title, loading, and emptyListMessage.
 */
const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) => {
  // Handler for when a transaction item is clicked
  const handleClick = () => {
    //todo: open transaction details
  };

  return (
    <View style={styles.container}>
      {/* Optional list title */}
      {title && (
        <Typo size={20} fontWeight={500}>
          {title}
        </Typo>
      )}

      {/* Transaction list */}
      <View style={styles.list}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem
              item={item}
              index={index}
              handleClick={handleClick}
            />
          )}
          estimatedItemSize={60}
        />
      </View>

      {/* Show empty list message if not loading and data is empty */}
      {!loading && data.length === 0 && (
        <Typo
          size={15}
          color={colors.neutral400}
          style={{ textAlign: "center", marginTop: spacingY._15 }}
        >
          {emptyListMessage}
        </Typo>
      )}

      {/* Show loading indicator if loading */}
      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
};

/**
 * TransactionItem represents a single transaction in the list.
 * @param {TransactionItemProps} props - Props containing item, index, and handleClick.
 */
const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  let category = expenseCategories["utilities"];
  //   console.log("category: ", category);

  const IconComponent = category.icon;
  return (
    // Animated view with fade-in-down effect, delayed by index for staggered animation
    <Animated.View
      entering={FadeInDown.delay(index * 100)
        .springify()
        .damping(14)}
    >
      {/* Touchable row for the transaction */}
      <TouchableOpacity style={styles.row} onPress={handleClick(item)}>
        {/* Category icon */}
        <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )}
        </View>

        {/* Category label and description */}
        <View style={styles.categoryDes}>
          <Typo size={17}>{category.label}</Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            {/* {item?.description} */}
            paid wifi bill
          </Typo>
        </View>

        {/* Amount and date */}
        <View style={styles.amountDate}>
          <Typo fontWeight={500} color={colors.rose}>
            {/* {item?.amount} */}- $23
          </Typo>
          <Typo size={13} color={colors.neutral400}>
            {/* {item?.date} */}
            12 Jan
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TransactionList;

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
  },
  list: {
    minHeight: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    marginBottom: spacingY._12,

    //list with background
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: radius._17,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
});
