import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/constants";
import axios from "axios";

// Construct the Cloudinary API URL using your cloud name
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads a file (image) to Cloudinary.
 * @param file - The file object (with uri) or a string (already uploaded URL).
 * @param folderName - The Cloudinary folder to upload the image to.
 * @returns An object with success status and either the image URL or error message.
 */
export const uploadFileToCloudinary = async (
  file: { uri?: string } | string,
  folderName: string
) => {
  try {
    // If file is already a string (URL), just return it as successful
    if (typeof file == "string") {
      return { success: true, data: file };
    }

    // If file is an object with a uri property, upload it to Cloudinary
    if (file && file?.uri) {
      console.log("Image has uri");
      const formData = new FormData();

      // Append the image file to the form data
      formData.append("file", {
        uri: file?.uri,
        type: "image/jpeg",
        name: file?.uri.split("/").pop() || "file.jpg",
      } as any);

      // Append Cloudinary upload preset and folder name
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folderName);

      // Make the POST request to Cloudinary API
      const response = await axios.post(CLOUDINARY_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Image upload result:", response?.data);

      // Return the secure URL of the uploaded image
      return { success: true, data: response?.data?.secure_url };
    }
  } catch (error: any) {
    console.log("(imageService.ts)Error Uploading Image", error);
    return { success: false, msg: error.message || "Error Uploading Image " };
  }
};

/**
 * Returns the correct profile image path.
 * @param file - The file can be a string (URL), object (with uri), or undefined.
 * @returns The image URL, local uri, or a default image if none provided.
 */
export const getProfileImage = (file: any) => {
  if (file && typeof file == "string") return file;
  if (file && typeof file == "object") return file.uri;

  // If no file provided, return a default avatar image
  const defaultImage = require("../assets/images/defaultAvatar.png");
  return defaultImage;
};

/**
 * Returns the file path (URL or local uri) for an image.
 * @param file - The file can be a string (URL), object (with uri), or undefined.
 * @returns The image URL or uri, or null if not available.
 */
export const getFilePath = (file: any) => {
  if (file && typeof file == "string") return file;
  if (file && typeof file == "object") return file.uri;

  return null;
};
