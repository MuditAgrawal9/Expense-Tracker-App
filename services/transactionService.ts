import { firestore } from "@/config/firebase";
import { colors } from "@/constants/theme";
import { createOrUpdateWallet } from "@/services/walletService";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

/**
 * Creates or updates a transaction in Firestore and updates the associated wallet's balance.
 * Handles image uploads for transaction receipts.
 */
export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    // Destructure transaction data for validation
    const { id, type, amount, image, walletId } = transactionData;

    // Validate required fields
    if (!amount || amount <= 0 || !walletId || !type) {
      return { success: false, msg: "Invalid transaction data!" };
    }

    if (id) {
      //update the transaction
      const oldTransactionSnapshot = await getDoc(
        doc(firestore, "transactions", id)
      );
      const oldTransaction = oldTransactionSnapshot.data() as TransactionType;

      const shouldRevertOriginal =
        oldTransaction?.type !== type ||
        oldTransaction?.walletId !== walletId ||
        oldTransaction?.amount !== amount;

      // If the transaction type or wallet has changed, revert the original transaction's effect on the wallet
      if (shouldRevertOriginal) {
        let res = await revertAndUpdateWallets(
          oldTransaction,
          Number(amount),
          type,
          walletId
        );
        if (!res.success) {
          return res;
        }
      }
    } else {
      //create transaction
      // For new transactions: Update the wallet's balance
      let res = await updateWalletForNewTransaction(
        walletId,
        Number(amount),
        type
      );
      if (!res.success) {
        return res;
      }
    }

    // Upload receipt image to Cloudinary if provided
    if (image) {
      const imageUploadRes = await uploadFileToCloudinary(
        image,
        "transactions"
      );
      if (!imageUploadRes?.success) {
        return {
          success: false,
          msg: imageUploadRes?.msg || "Failed to Upload receipt",
        };
      }
      transactionData.image = imageUploadRes.data;
    } else {
      transactionData.image = "";
    }
    // Get Firestore reference for new or existing transaction
    const transactionRef = id
      ? doc(firestore, "transactions", id) // Existing transaction
      : doc(collection(firestore, "transactions")); // New transaction

    // Create/update the transaction document
    await setDoc(transactionRef, transactionData, { merge: true });

    return {
      success: true,
      data: { ...transactionData, id: transactionRef.id },
      msg: id
        ? "Transaction Updated Successfull"
        : "Transaction Added Successfully",
    };
  } catch (error: any) {
    console.log("Error creating or updating the transaction :", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Updates a wallet's balance and income/expense totals when a new transaction is added.
 */
const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string
) => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    const walletSnapshot = await getDoc(walletRef);

    // Check if wallet exists
    if (!walletSnapshot.exists()) {
      console.log("Wallet not found");
      return { success: false, msg: "Wallet not found" };
    }

    const walletData = walletSnapshot.data() as WalletType;

    // Validate sufficient balance for expenses
    if (type === "expense" && walletData.amount! < amount) {
      return {
        success: false,
        msg: "Selected wallet doesn't have enough balance",
      };
    }
    // Determine which field to update (income/expense)
    const updateType = type === "income" ? "totalIncome" : "totalExpenses";

    // Calculate new wallet balance
    const updatedWalletAmount =
      type === "income"
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount;

    // Calculate new income/expense total
    const updatedTotals =
      type === "income"
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpenses) + amount;

    // Update wallet document
    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updateType]: updatedTotals,
    });
    return { success: true };
  } catch (error: any) {
    console.log("Error updating the wallet for new  transaction :", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Reverts the effect of an old transaction on its original wallet,
 * then applies the effect of the new transaction (possibly with a new/same wallet, amount, or type).
 * Ensures wallet balances and totals are always correct.
 *
 * @param oldTransaction - The original transaction object before update
 * @param newTransactionAmount - The new transaction amount
 * @param newTransactionType - The new transaction type ("income" or "expense")
 * @param newTransactionWalletId - The wallet ID for the new transaction
 * @returns {Promise<ResponseType>} - Success or failure response
 */
const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newTransactionWalletId: string
) => {
  try {
    // Fetch the original wallet snapshot and data (where the old transaction was recorded)
    const originalWalletSnapshot = await getDoc(
      doc(firestore, "wallets", oldTransaction?.walletId)
    );
    const originalWalletData = originalWalletSnapshot.data() as WalletType;

    // Fetch the new wallet snapshot and data (where the updated transaction will be recorded)
    let newWalletSnapshot = await getDoc(
      doc(firestore, "wallets", newTransactionWalletId)
    );
    let newWalletData = newWalletSnapshot.data() as WalletType;

    // Determine which field to revert: totalIncome or totalExpenses
    const revertType =
      oldTransaction.type === "income" ? "totalIncome" : "totalExpenses";

    // Calculate how much to revert from the original wallet's balance
    // If it was income, subtract the amount; if expense, add it back
    const revertAmount: number =
      oldTransaction.type === "income"
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);

    // Calculate the reverted wallet balance and totals
    const revertedWalletAmount =
      Number(originalWalletData.amount) + revertAmount;
    const revertedTotals =
      Number(originalWalletData[revertType]) - Number(oldTransaction.amount);

    // --- Validation: Ensure sufficient balance for new expense ---
    if (newTransactionType === "expense") {
      // If changing type or wallet, check if the original wallet (after revert) has enough for the new expense
      if (
        oldTransaction.walletId === newTransactionWalletId &&
        revertedWalletAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: "Selected wallet doesn't have enough balance",
        };
      }

      // If using a different wallet, check that wallet's balance
      if (newWalletData.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: "Selected wallet doesn't have enough balance",
        };
      }
    }

    // --- Step 1: Revert the effect of the old transaction on the original wallet ---
    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedTotals,
    });
    //revert completed

    // ---------------------------------------------

    // --- Step 2: Refetch the new wallet data (in case it was just updated above) ---
    newWalletSnapshot = await getDoc(
      doc(firestore, "wallets", newTransactionWalletId)
    );
    newWalletData = newWalletSnapshot.data() as WalletType;

    // Determine which field to update for the new transaction: totalIncome or totalExpenses
    const updateType =
      newTransactionType === "income" ? "totalIncome" : "totalExpenses";

    // Calculate new wallet balance
    const updatedWalletAmount =
      newTransactionType === "income"
        ? Number(newWalletData.amount) + newTransactionAmount
        : Number(newWalletData.amount) - newTransactionAmount;

    // Calculate new income/expense total
    const updatedTotals =
      newTransactionType === "income"
        ? Number(newWalletData.totalIncome) + newTransactionAmount
        : Number(newWalletData.totalExpenses) + newTransactionAmount;

    // --- Step 3: Apply the new transaction's effect to the (possibly new) wallet ---
    await createOrUpdateWallet({
      id: newTransactionWalletId,
      amount: updatedWalletAmount,
      [updateType]: updatedTotals,
    });

    return { success: true };
  } catch (error: any) {
    console.log("Error updating the wallet for new  transaction :", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Deletes a transaction and reverts its effect on the associated wallet.
 * Ensures wallet balance and totals remain accurate after deletion.
 *
 * @param transactionId - The ID of the transaction to delete
 * @param walletId - The ID of the wallet associated with the transaction
 * @returns {Promise<ResponseType>} - Success or failure response
 */
export const deleteTransaction = async (
  transactionId: string,
  walletId: string
) => {
  try {
    // Fetch the transaction to get its details
    const transactionRef = doc(firestore, "transactions", transactionId);
    const transactionSnapshot = await getDoc(transactionRef);
    if (!transactionSnapshot.exists()) {
      return { success: false, msg: "Transaction not found" };
    }

    // Get transaction data (amount and type are needed to revert wallet)
    const transactionData = transactionSnapshot.data() as TransactionType;
    const { amount: transactionAmount, type: transactionType } =
      transactionData;

    // Fetch the wallet to update its balance n totals
    const walletSnapshot = await getDoc(doc(firestore, "wallets", walletId));
    const walletData = walletSnapshot.data() as WalletType;

    // Determine which field to update:totalIncome or totalExpenses
    const updateType =
      transactionType === "income" ? "totalIncome" : "totalExpenses";

    // Calculate the new wallet balance after deleting the transaction
    // For income: subtract the amount (since it was previously added)
    // For expense: add the amount back (since it was previously subtracted)
    const updatedWalletAmount =
      transactionType === "income"
        ? Number(walletData.amount) - transactionAmount
        : Number(walletData.amount) + transactionAmount;

    // Calculate new income/expense total
    const updatedTotals =
      transactionType === "income"
        ? Number(walletData.totalIncome) - transactionAmount
        : Number(walletData.totalExpenses) - transactionAmount;

    // Prevent negative balances ---
    if (updatedWalletAmount < 0) {
      return {
        success: false,
        msg: "Selected wallet doesn't have enough balance after deletion",
      };
    }

    // Revert the transaction's effect on the wallet
    await createOrUpdateWallet({
      id: walletId,
      amount: updatedWalletAmount,
      [updateType]: updatedTotals,
    });

    // Delete the transaction document from Firestore ----
    await deleteDoc(doc(firestore, "transactions", transactionId));

    return { success: true, msg: "Transaction deleted successfully" };
  } catch (error: any) {
    console.log("Error deleting the transaction :", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Fetches weekly income and expense statistics for a user from Firestore.
 *
 * - Retrieves all transactions for the specified user from the past 7 days.
 * - Aggregates income and expense totals for each day of the week.
 * - Formats the data for use in a bar chart and also returns the raw transactions.
 *
 * @param uid - The user's unique identifier.
 * @returns A promise resolving to an object containing:
 *    - success: boolean indicating if the fetch was successful
 *    - data: { stats: Array for chart, transactions: Array of transactions }
 *    - msg: Status or error message
 */
export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;

    // Get today's date and the date 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Build a Firestore query to get transactions for the user in the last 7 days
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("uid", "==", uid),
      where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc")
    );

    // Execute the query and get the results
    const querySnapshot = await getDocs(transactionsQuery);

    // Initialize weekly data structure (one entry per day for the last 7 days)
    const weeklyData = getLast7Days();

    // This will hold all transactions fetched
    const transactions: TransactionType[] = [];

    // Loop through each transaction document
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id; // Add the document ID to the transaction
      transactions.push(transaction);

      // Get the transaction's date as a string in 'YYYY-MM-DD' format
      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        .toISOString()
        .split("T")[0];

      // Find the corresponding day in weeklyData
      const dayData = weeklyData.find((day) => day.date === transactionDate);

      // If the transaction matches a day in the last 7 days, update income/expense
      if (dayData) {
        if (transaction.type === "income") {
          dayData.income += transaction.amount || 0;
        } else if (transaction.type === "expense") {
          dayData.expense += transaction.amount || 0;
        }
      }
    });

    // Prepare the stats array for the bar chart
    // Each day is mapped to two bars: income and expense
    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary,
      },
      { value: day.expense, frontColor: colors.rose },
    ]);

    // Return the stats and transactions in a success response
    return {
      success: true,
      data: { stats, transactions },
      msg: "Weekly stats fetched successfully",
    };
  } catch (error: any) {
    console.log("Error fetching weekly stats:", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Fetches monthly income and expense statistics for a user from Firestore.
 *
 * - Retrieves all transactions for the specified user from the past 12 months.
 * - Aggregates income and expense totals for each month.
 * - Formats the data for use in a bar chart and also returns the raw transactions.
 *
 * @param uid - The user's unique identifier.
 * @returns A promise resolving to an object containing:
 *    - success: boolean indicating if the fetch was successful
 *    - data: { stats: Array for chart, transactions: Array of transactions }
 *    - msg: Status or error message
 */
export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;

    // Get today's date and the date 12 months ago
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    // Build a Firestore query to get transactions for the user in the last 12 months
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("uid", "==", uid),
      where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc")
    );

    // Execute the query and get the results
    const querySnapshot = await getDocs(transactionsQuery);

    // Initialize monthly data structure (one entry per month for the last 12 months)
    const monthlyData = getLast12Months();

    // This will hold all transactions fetched
    const transactions: TransactionType[] = [];

    // Loop through each transaction document
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id; // Add the document ID to the transaction
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp).toDate();

      // Format month and year, e.g., "Jan 25"
      const monthName = transactionDate.toLocaleString("default", {
        month: "short",
      });
      const shortYear = transactionDate.getFullYear().toString().slice(-2); // Last two digits of year
      const formattedMonthYear = `${monthName} ${shortYear}`; // e.g., "Jan 25"

      // Find the corresponding month in monthlyData
      const monthData = monthlyData.find(
        (month) => month.month === formattedMonthYear
      );

      // If the transaction matches a month in the last 12 months, update income/expense
      if (monthData) {
        if (transaction.type === "income") {
          monthData.income += transaction.amount || 0;
        } else if (transaction.type === "expense") {
          monthData.expense += transaction.amount || 0;
        }
      }
    });

    // Prepare the stats array for the bar chart
    // Each month is mapped to two bars: income and expense
    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(46),
        frontColor: colors.primary,
      },
      { value: month.expense, frontColor: colors.rose },
    ]);

    // Return the stats and transactions in a success response
    return {
      success: true,
      data: { stats, transactions },
      msg: "Monthly stats fetched successfully",
    };
  } catch (error: any) {
    console.log("Error fetching monthly stats:", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Fetches yearly income and expense statistics for a user from Firestore.
 *
 * - Retrieves all transactions for the specified user.
 * - Finds the earliest transaction year and aggregates income and expense totals for each year up to the current year.
 * - Formats the data for use in a bar chart and also returns the raw transactions.
 *
 * @param uid - The user's unique identifier.
 * @returns A promise resolving to an object containing:
 *    - success: boolean indicating if the fetch was successful
 *    - data: { stats: Array for chart, transactions: Array of transactions }
 *    - msg: Status or error message
 */
export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;

    // Query all transactions for the user, ordered by date descending
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("uid", "==", uid),
      orderBy("date", "desc")
    );

    // Execute the query and get the results
    const querySnapshot = await getDocs(transactionsQuery);

    // This will hold all transactions fetched
    const transactions: TransactionType[] = [];

    // Find the earliest transaction date among all documents
    // If there are no transactions, default to the current date
    const firstTransactionDate = querySnapshot.docs.reduce((earliest, doc) => {
      const transactionDate = doc.data().date.toDate();
      return transactionDate < earliest ? transactionDate : earliest;
    }, new Date());

    // Get the start year from the earliest transaction
    const startYear = firstTransactionDate.getFullYear();
    // Get the current year
    const currentYear = new Date().getFullYear();
    // Initialize yearly data structure (one entry per year from startYear to currentYear)
    const yearlyData = getYearsRange(startYear, currentYear);

    // Loop through each transaction document
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id; // Add the document ID to the transaction
      transactions.push(transaction);

      // Get the year from the transaction's date
      const transactionYear = (transaction.date as Timestamp)
        .toDate()
        .getFullYear();

      // Find the corresponding month in yearlyData
      const yearData = yearlyData.find(
        (item: any) => item.year === transactionYear.toString()
      );

      // If the transaction matches a year, update income/expense
      if (yearData) {
        if (transaction.type === "income") {
          yearData.income += transaction.amount || 0;
        } else if (transaction.type === "expense") {
          yearData.expense += transaction.amount || 0;
        }
      }
    });

    // Prepare the stats array for the bar chart
    // Each year is mapped to two bars: income and expense
    const stats = yearlyData.flatMap((year: any) => [
      {
        value: year.income,
        label: year.year,
        spacing: scale(4),
        labelWidth: scale(35),
        frontColor: colors.primary,
      },
      { value: year.expense, frontColor: colors.rose },
    ]);

    // Return the stats and transactions in a success response
    return {
      success: true,
      data: { stats, transactions },
      msg: "Yearly stats fetched successfully",
    };
  } catch (error: any) {
    console.log("Error fetching yearly stats:", error);
    return { success: false, msg: error.message };
  }
};
