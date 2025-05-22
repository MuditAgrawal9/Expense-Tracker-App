import { colors, radius } from "@/constants/theme";
import { getFilePath } from "@/services/imageService";
import { ImageUploadProps } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Icons from "phosphor-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Typo from "./Typo";

// ImageUpload component definition
const ImageUpload = ({
  file = null,
  onSelect, // Callback when a new image is selected
  onClear, // Callback when the image is cleared
  containerStyle,
  imageStyle,
  placeholder = "",
}: ImageUploadProps) => {
  // Function to launch the image picker and handle selection
  const pickImage = async () => {
    // Launch the image library (no explicit permission required)
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      //   allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    // console.log(result);
    // If the user selects an image (not canceled)
    if (!result.canceled) {
      onSelect(result.assets[0]);
    }
  };

  return (
    <View>
      {/* Show upload button if no image is selected */}
      {!file && (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.inputContainer, containerStyle && containerStyle]}
        >
          <Icons.UploadSimple color={colors.neutral300} />
          {placeholder && <Typo size={15}>{placeholder}</Typo>}
        </TouchableOpacity>
      )}

      {/* Show image preview and delete icon if image is selected */}
      {file && (
        <View style={[styles.image, imageStyle && imageStyle]}>
          <Image
            style={{ flex: 1 }}
            source={getFilePath(file)} // Get path/URI for the image
            contentFit="cover"
            transition={100}
          />

          {/* Delete icon to clear the selected image */}
          <TouchableOpacity style={styles.deleteIcon} onPress={onClear}>
            <Icons.XCircle
              size={verticalScale(24)}
              weight="fill"
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ImageUpload;

const styles = StyleSheet.create({
  inputContainer: {
    height: verticalScale(54),
    backgroundColor: colors.neutral700,
    borderRadius: radius._15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral500,
    borderStyle: "dashed",
  },
  image: {
    height: verticalScale(150),
    width: verticalScale(150),
    borderRadius: radius._15,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  deleteIcon: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});
