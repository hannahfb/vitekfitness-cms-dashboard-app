import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import { WixDesignSystemProvider, Box, Text } from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import SaveConfirmationModal from "../../../components/SaveConfirmation";
import { items } from "@wix/data";

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('37a73e82-eabd-4e01-96f4-b44aa22723c2')}>Open Modal</button>;
// }
const Modal: FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [params, setParams] = useState<{
    id: string;
    question: string;
  } | null>(null);

  useEffect(() => {
    const subscription = dashboard.observeState((state: { id: string; question: string }) => {
      setParams({
        id: state.id,
        question: decodeURIComponent(state.question),
      });
    });

    return () => subscription.disconnect();
  }, []);

  const handleConfirmDelete = async () => {
    if (!params) return;

    setIsDeleting(true);

    try {
      await items.remove("faq", params.id);

      dashboard.showToast({
        message: "Question successfully deleted",
        type: "success",
      });

      dashboard.closeModal({ deleted: true });
    } catch (error) {
      console.error("Failed to delete question ", error);

      dashboard.showToast({
        message: "Failed to delete question",
        type: "error",
      });

      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    dashboard.closeModal({ deleted: false });
  };

  if (!params) {
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
      <SaveConfirmationModal
        title="Delete question"
        message={`Are you sure you want to delete the question "${params.question}"? This action cannot be undone.`}
        primaryButtonText="Yes, delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancel}
        isLoading={isDeleting}
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
