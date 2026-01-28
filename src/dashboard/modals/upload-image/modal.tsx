import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
  FormField,
  Input,
  Button,
  Image,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { width, height } from "./modal.json";
import * as Icons from "@wix/wix-ui-icons-common";
import { convertWixImageUrl } from "../../../utils/content";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

const Modal: FC = () => {
  const [imageData, setImageData] = useState({
    id: "",
    currentImage: "",
    altText: "",
    expectedWidth: "",
    expectedHeight: "",
    newImageUrl: null as string | null,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const subscription = dashboard.observeState(
      (params: {
        id: string;
        image: string;
        imageAltText: string;
        imageWidth: string;
        imageHeight: string;
      }) => {
        const decodedImage = decodeURIComponent(params.image || "");

        setImageData({
          id: params.id,
          currentImage: decodedImage,
          altText: decodeURIComponent(params.imageAltText || ""),
          expectedWidth: params.imageWidth,
          expectedHeight: params.imageHeight,
          newImageUrl: decodedImage,
        });
      },
    );

    return () => subscription.disconnect();
  }, []);

  const handleImageUpload = () => {
    dashboard.closeModal({
      action: "openMediaManager",
      id: imageData.id,
      altText: imageData.altText,
    });
  };

  const handleClickSave = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = () => {
    dashboard.closeModal({
      saved: true,
      newImageUrl: imageData.newImageUrl,
      altText: imageData.altText,
      itemId: imageData.id,
    });
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
  };

  if (!imageData.id) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Box padding="SP4">
          <Text>Loading...</Text>
        </Box>
      </WixDesignSystemProvider>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      {showConfirmation ? (
        <SaveConfirmationModal
          message="These changes will be live immediately. Are you sure you want to update this image?"
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          isLoading={false}
        />
      ) : (
        <CustomModalLayout
          width={width}
          maxHeight={height}
          primaryButtonText="Save"
          secondaryButtonText="Cancel"
          primaryButtonOnClick={handleClickSave}
          secondaryButtonOnClick={() => dashboard.closeModal({ saved: false })}
          title="Update image"
          subtitle={`Upload a new image. Required dimensions: ${imageData.expectedWidth}x${imageData.expectedHeight} px`}
          content={
            <Box direction="vertical" gap="SP4">
              <Box align="center">
                <Image
                  src={convertWixImageUrl(imageData.currentImage) || ""}
                  width="300px"
                  height="100%"
                />
              </Box>

              <Text size="small" secondary>
                Required dimensions: {imageData.expectedWidth}x
                {imageData.expectedHeight} px
              </Text>

              <Button
                size="small"
                prefixIcon={<Icons.Upload />}
                onClick={handleImageUpload}
              >
                Choose New Image
              </Button>

              <FormField label="Alt Text">
                <Input
                  value={imageData.altText}
                  onChange={(e) =>
                    setImageData((prev) => ({
                      ...prev,
                      altText: e.target.value,
                    }))
                  }
                />
              </FormField>
            </Box>
          }
        />
      )}
    </WixDesignSystemProvider>
  );
};

export default Modal;
