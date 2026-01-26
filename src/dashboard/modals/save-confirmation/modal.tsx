import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import { WixDesignSystemProvider } from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

import { items } from "@wix/data";

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('a8f952c2-c46a-4f6e-b129-4a4ae98b8537')}>Open Modal</button>;
// }
const Modal: FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [params, setParams] = useState<{
    id: string;
    header: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    const subscription = dashboard.observeState(
      (state: { id: string; header: string; content: string }) => {
        setParams({
          id: state.id,
          header: decodeURIComponent(state.header),
          content: decodeURIComponent(state.content),
        });
      }
    );

    return () => subscription.disconnect();
  }, []);

  const handleConfirmSave = async () => {
    if (!params) return;

    setIsSaving(true);

    try {
      let patchQuery = items.patch("text", params.id);

      Object.entries(params).forEach(([key, value]) => {
        if (key !== `id`) {
          patchQuery = patchQuery.setField(key, value);
        }
      });

      await patchQuery.run();
      
      dashboard.closeModal({ saved: true });
    } catch (error) {
      console.error("Failed to save item:", error);
      dashboard.showToast({
        message: "Failed to save changes",
        type: "error",
      });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    dashboard.closeModal({ saved: false });
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <SaveConfirmationModal
        message="Are you sure you want to save these changes?"
        onConfirm={handleConfirmSave}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
