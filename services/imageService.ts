export const getProfileImage = (file: any) => {
  if (file && typeof file == "string") return file;
  if (file && typeof file == "object") return file.uri;

  const defaultImage = require("../assets/images/defaultAvatar.png");
  return defaultImage;
};
