import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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
    if (!walletSnapshot) {
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
