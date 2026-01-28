import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
  Layout,
  FormField,
  Cell,
  Input,
  NumberInput,
} from "@wix/design-system";
import { items } from "@wix/data";
import "@wix/design-system/styles.global.css";
import { PackageItem } from "../../../types";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

const Modal: FC = () => {
  const [id, setId] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<PackageItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const subscription = dashboard.observeState((params: { id: string }) => {
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

    return () => subscription.disconnect();
  }, []);

  // SAVE CONFIRMATION & CANCELLATION
  const handleClickSave = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!id) return;

    setIsSaving(true);

    try {
      await items
        .patch("packages", id)
        .setField("title", packageData?.name)
        .setField("type", packageData?.type)
        .setField("totalPrice", packageData?.totalPrice)
        .setField("sessionPrice", packageData?.sessionPrice)
        .setField("sessionsQty", packageData?.sessionQty)
        .setField("validityMonths", packageData?.validity)
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
          skin="standard"
          primaryButtonText="Save"
          primaryButtonOnClick={handleClickSave}
          secondaryButtonText="Cancel"
          secondaryButtonOnClick={() => dashboard.closeModal()}
          title={"Edit package"}
          content={
            <Layout gap="20px">
              <Cell>
                <FormField label="Package Name">
                  <Input readOnly value={packageData?.name} />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Package Type">
                  <Input
                    value={packageData?.type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPackageData((prev) =>
                        prev
                          ? {
                              ...prev,
                              type: e.target.value,
                              name: `${e.target.value} - ${prev.sessionQty} Sessions`,
                            }
                          : null
                      )
                    }
                    readOnly
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Number of Sessions">
                  <NumberInput
                    value={packageData?.sessionQty}
                    onChange={(value) =>
                      setPackageData((prev) =>
                        prev
                          ? {
                              ...prev,
                              sessionQty: Number(value),
                              name: `${prev.type} - ${Number(value)} Sessions`,
                              totalPrice: Number(value) * prev.sessionPrice,
                            }
                          : null
                      )
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Total Price">
                  <NumberInput
                    readOnly
                    prefix={<Input.Affix>€</Input.Affix>}
                    value={packageData?.totalPrice}
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Session Price">
                  <NumberInput
                    prefix={<Input.Affix>€</Input.Affix>}
                    value={packageData?.sessionPrice}
                    onChange={(value) =>
                      setPackageData((prev) =>
                        prev && value !== null
                          ? {
                              ...prev,
                              sessionPrice: Number(value),
                              totalPrice: Number(value) * prev.sessionQty,
                            }
                          : prev
                      )
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Validity (months)">
                  <NumberInput
                    value={packageData?.validity}
                    onChange={(value) =>
                      setPackageData((prev) =>
                        prev
                          ? {
                              ...prev,
                              validity: Number(value),
                            }
                          : null
                      )
                    }
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
