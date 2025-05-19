import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/constants";
import axios from "axios";

const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadFileToCloudinary = async (
  file: { uri?: string } | string,
  folderName: string
) => {
  try {
    if (typeof file == "string") {
      return { success: true, data: file };
    }

    if (file && file?.uri) {
      console.log("Image has uri");
      const formData = new FormData();
      formData.append("file", {
        uri: file?.uri,
        type: "image/jpeg",
        name: file?.uri.split("/").pop() || "file.jpg",
      } as any);

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folderName);

      const response = await axios.post(CLOUDINARY_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Image upload result:", response?.data);
      return { success: true, data: response?.data?.secure_url };
    }
  } catch (error: any) {
    console.log("(imageService.ts)Error Uploading Image", error);
    return { success: false, msg: error.message || "Error Uploading Image " };
  }
};
export const getProfileImage = (file: any) => {
  if (file && typeof file == "string") return file;
  if (file && typeof file == "object") return file.uri;

  const defaultImage = require("../assets/images/defaultAvatar.png");
  return defaultImage;
};
