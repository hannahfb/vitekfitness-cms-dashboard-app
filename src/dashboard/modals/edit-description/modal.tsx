import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
  RichTextInputArea,
  Layout,
  Cell,
  Heading,
  FormField,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { width, height } from "./modal.json";
import { items } from "@wix/data";
import { PackageItem, PackageRecord } from "../../../types";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('bb733afb-b807-4811-9122-04428fb97dd9')}>Open Modal</button>;
// }
const Modal: FC = () => {
  const [id, setId] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<PackageItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    dashboard.observeState((params: { id: string }) => {
      const currentId = params.id;
      if (!currentId) return;

      setId(currentId);

      async function getRowData() {
        try {
          const result = await items.query("packages").find();
          const match = result.items.find((item) => item._id === currentId);

          if (!match) {
            console.error(`No package found for ID: ${currentId}`);
            setPackageData(null);
            return;
          }

          const formatted: PackageItem = {
            id: match._id,
            type: match.packageType,
            name: match.title,
            totalPrice: match.totalPrice,
            sessionPrice: match.sessionPrice,
            sessionQty: match.sessionsQty,
            validity: match.validityMonths,
            description: match.description,
          };
          setPackageData(formatted);
        } catch (error) {
          console.error("Error fetching package: ", error);
          setPackageData(null);
        }
      }

      getRowData();
    });
  }, []);

  // UPDATE DESCRIPTION AS TYPING
  const handleDescriptionChange = (newDescription: string) => {
    if (!packageData) return;
    setPackageData({ ...packageData, description: newDescription });
  };

  // HANDLES FOR SAVING & CANCELLING
  const handleClickSave = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!id) return;

    setIsSaving(true);

    try {
      const updatedItem = await items
        .patch("packages", id)
        .setField("description", packageData?.description)
        .run();

      dashboard.showToast({
        message: "Your changes were saved.",
        type: "success",
      });

      dashboard.closeModal({ saved: true });
    } catch (error) {
      console.error("Error saving description: ", error);

      dashboard.showToast({
        message: "Failed to save changes",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
  };

  if (!packageData) {
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
          message={`These changes will be live immediately. Are you sure you want to save these to the ${packageData.type} description?`}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          isLoading={isSaving}
        />
      ) : (
        <CustomModalLayout
          width={width}
          maxHeight={height}
          primaryButtonText="Save"
          secondaryButtonText="Cancel"
          primaryButtonOnClick={handleClickSave}
          secondaryButtonOnClick={() => dashboard.closeModal()}
          title={"Edit package description"}
          subtitle={
            "As a 'rich text' format, you can add formatting like bold or italics."
          }
          content={
            <Layout gap="20px">
              <Cell span={12}>
                <Heading size="medium">{packageData.type}</Heading>
              </Cell>
              <Cell span={12}>
                <FormField label="Description">
                  <RichTextInputArea
                    key={packageData.id}
                    minHeight="120px"
                    initialValue={packageData.description}
                    onChange={handleDescriptionChange}
                  />
                </FormField>
              </Cell>
            </Layout>
          }
        />
      )}
    </WixDesignSystemProvider>
  );
};

export default Modal;
