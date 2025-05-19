import { firestore } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const updateUser = async (uid: string, name: string, image: any) => {
  try {
    //image
    if (image && image?.uri) {
      const imageUploadRes = await uploadFileToCloudinary(image, "users");
      if (!imageUploadRes?.success) {
        return {
          success: false,
          msg: imageUploadRes?.msg || "Failed to Upload Images",
        };
      }
      image = imageUploadRes.data;
    }

    const userRef = doc(firestore, "users", uid);
    //firebase doc update (not user state in app)
    await updateDoc(userRef, { name: name, image: image });
    return { success: true, msg: "Updated successfully" };
  } catch (error: any) {
    console.log("Error in userService.ts", error);
    return { success: false, msg: error?.message || String(error) };
  }
};
