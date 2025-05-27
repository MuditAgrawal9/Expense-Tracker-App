import { firestore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

/**
 * Creates or updates a wallet document in Firestore.
 * Also handles image upload to Cloudinary if an image is provided.
 *
 * @param walletData - Partial wallet data (can be used for both create and update)
 * @returns A promise resolving to a ResponseType indicating success or failure
 */
export const createOrUpdateWallet = async (
  walletData: Partial<WalletType>
): Promise<ResponseType> => {
  try {
    let walletToSave = { ...walletData };

    // If an image is provided and it's a local file (has uri), upload to Cloudinary
    if (walletData.image && walletData.image?.uri) {
      const imageUploadRes = await uploadFileToCloudinary(
        walletData.image,
        "wallets" // Upload to the 'wallets' folder in Cloudinary
      );
      if (!imageUploadRes?.success) {
        return {
          success: false,
          msg: imageUploadRes?.msg || "Failed to Upload Wallet Icon",
        };
      }

      // Replace the image with the Cloudinary URL
      walletToSave.image = imageUploadRes.data;
    }

    // If walletData has no id, treat as new wallet and set default properties
    if (!walletData?.id) {
      //new wallet
      walletToSave.amount = 0;
      walletToSave.totalExpenses = 0;
      walletToSave.totalIncome = 0;
      walletToSave.created = new Date();
    }

    // Get a Firestore document reference:
    // - If id exists, use it (update)
    // - Otherwise, create a new document (create)
    const walletRef = walletData?.id
      ? doc(firestore, "wallets", walletData?.id)
      : doc(collection(firestore, "wallets"));

    // Save the wallet data to Firestore (merge: true updates only provided fields)
    await setDoc(walletRef, walletToSave, { merge: true });

    // Return success response with the saved wallet data and its id
    return {
      success: true,
      data: { ...walletToSave, id: walletRef?.id },
      msg: "Success",
    };
  } catch (error: any) {
    console.log("Error craeting or updating the wallet:", error);
    return { success: false, msg: error.message };
  }
};

/**
 * Deletes a wallet and all transactions associated with it.
 *
 * @param walletId - The ID of the wallet to delete
 * @returns A promise resolving to a ResponseType indicating success or failure
 */

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
  try {
    // Get the Firestore document reference for the wallet
    const walletRef = doc(firestore, "wallets", walletId);

    // Delete all transactions linked to this wallet
    await deleteTransactionsByWalletId(walletId);

    // Delete the wallet document itself
    await deleteDoc(walletRef);

    return { success: true, msg: "Wallet deleted successfully" };
  } catch (error: any) {
    console.log("Error deleting wallet: ", error);
    return { success: false, msg: error.msg };
  }
};

/**
 * Deletes all transactions associated with a given walletId.
 * Uses batch deletes for efficiency and loops in case there are more than 500 transactions.
 *
 * @param walletId - The ID of the wallet whose transactions should be deleted
 * @returns A promise resolving to a ResponseType indicating success or failure
 */
export const deleteTransactionsByWalletId = async (
  walletId: string
): Promise<ResponseType> => {
  try {
    let hasMoreTransactions = true;
    while (hasMoreTransactions) {
      // Query all transactions related to the given walletId
      const transactionsQuery = query(
        collection(firestore, "transactions"),
        where("walletId", "==", walletId)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);

      // If no transactions are found, exit the loop
      if (transactionsSnapshot.empty) {
        hasMoreTransactions = false;
        break;
      }

      // Use a batch for efficiency (up to 500 deletes per batch)
      const batch = writeBatch(firestore);
      transactionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    return {
      success: true,
      msg: "All transactions linked to the wallet deleted successfully",
    };
  } catch (error: any) {
    console.log("Error deleting wallet: ", error);
    return { success: false, msg: error.msg };
  }
};
