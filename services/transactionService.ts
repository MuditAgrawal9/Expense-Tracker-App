import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";

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
