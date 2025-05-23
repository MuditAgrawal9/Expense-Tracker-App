import { firestore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
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

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    await deleteDoc(walletRef);

    //todo : delete all transactions related to this wallet

    return { success: true, msg: "Wallet deleted successfully" };
  } catch (error: any) {
    console.log("Error deleting wallet: ", error);
    return { success: false, msg: error.msg };
  }
};
