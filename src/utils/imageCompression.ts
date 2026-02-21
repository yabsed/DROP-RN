import * as ImagePicker from "expo-image-picker";
import { Action, manipulateAsync, SaveFormat } from "expo-image-manipulator";
const IMAGE_MAX_EDGE = 1920;

export const IMAGE_COMPRESSION = {
  targetQuality: 0.45,
} as const;

type CompressInput = {
  uri: string;
  width?: number;
  height?: number;
};

const buildResizeAction = (width?: number, height?: number): Action[] => {
  if (!width || !height) return [];
  const longestEdge = Math.max(width, height);
  if (longestEdge <= IMAGE_MAX_EDGE) return [];

  if (width >= height) {
    return [{ resize: { width: IMAGE_MAX_EDGE } }];
  }
  return [{ resize: { height: IMAGE_MAX_EDGE } }];
};

export const compressImageForUpload = async ({
  uri,
  width,
  height,
}: CompressInput): Promise<string> => {
  const compressedResult = await manipulateAsync(
    uri,
    buildResizeAction(width, height),
    {
      compress: IMAGE_COMPRESSION.targetQuality,
      format: SaveFormat.JPEG,
    },
  );
  return compressedResult.uri;
};

export const getLibraryPickerOptions = (): ImagePicker.ImagePickerOptions => ({
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 1,
});

export const getMissionCameraOptions = (): ImagePicker.ImagePickerOptions => ({
  mediaTypes: ["images"],
  allowsEditing: false,
  quality: 1,
});

export const getCameraCaptureOptions = () => ({
  quality: 1,
  skipProcessing: false,
});
