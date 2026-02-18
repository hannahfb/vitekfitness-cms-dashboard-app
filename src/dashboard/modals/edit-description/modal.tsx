import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
  RichTextInputArea,
  InputArea,
  Layout,
  Cell,
  Heading,
  FormField,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { width, height } from "./modal.json";
import { items } from "@wix/data";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

const Modal: FC = () => {
  const [id, setId] = useState<string | null>(null);
  const [section, setSection] = useState<string>("");
  const [description, setDescription] = useState<{ header: string; content: string }>({ header: "", content: "" });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const subscription = dashboard.observeState((params: { id: string; type: string }) => {
      const currentId = params.id;
      if (!currentId) return;

      setId(currentId);
      setSection(params.type || "");

      async function getRowData() {
        try {
          const result = await items.query("text").find();
          const match = result.items.find((item) => item._id === currentId);

          if (!match) {
            console.error(`No text item found for ID: ${currentId}`);
            return;
          }

          setDescription({ header: match.header || "", content: match.content || "" });
          setIsLoaded(true);
        } catch (error) {
          console.error("Error fetching description: ", error);
        }
      }

      getRowData();
    });

    return () => subscription.disconnect();
  }, []);

  // UPDATE FIELDS AS TYPING
  const handleDescriptionChange = (value: string, field: keyof typeof description) => {
    setDescription((prev) => ({ ...prev, [field]: value }));
  };

  // HANDLES FOR SAVING & CANCELLING
  const handleClickSave = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!id) return;

    setIsSaving(true);

    try {
      await items
        .patch("text", id)
        .setField("header", description.header)
        .setField("content", description.content)
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

  if (!isLoaded) {
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
          message={`These changes will be live immediately. Are you sure you want to save these to the ${section} description?`}
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
                <Heading size="medium">{section}</Heading>
              </Cell>
              <Cell span={12}>
                <FormField label="Duration">
                  <InputArea
                    key={`header-${id}`}
                    value={description.header}
                    onChange={(e) => handleDescriptionChange(e.target.value, "header")}
                    autoGrow
                    minRowsAutoGrow={1}
                  />
                </FormField>
              </Cell>
              <Cell span={12}>
                <FormField label="Description">
                  <RichTextInputArea
                    key={id}
                    minHeight="120px"
                    initialValue={description.content}
                    onChange={(newContent) => handleDescriptionChange(newContent, "content")}
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
