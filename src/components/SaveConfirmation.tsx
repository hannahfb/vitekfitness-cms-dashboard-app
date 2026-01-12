import React, { type FC } from "react";
import { MessageModalLayout, Box, Text, Loader } from "@wix/design-system";

interface ConfirmationModalProps {
  title?: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SaveConfirmationModal: FC<ConfirmationModalProps> = ({
  title = "Save changes",
  message,
  primaryButtonText = "Yes, Save",
  secondaryButtonText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <MessageModalLayout
      primaryButtonText={isLoading? "" : primaryButtonText}
      secondaryButtonText={secondaryButtonText}
      primaryButtonOnClick={onConfirm}
      secondaryButtonOnClick={onCancel}
      primaryButtonProps={{ 
        disabled: isLoading,
        prefixIcon: isLoading ? <Loader size="tiny" /> : undefined
       }}
      secondaryButtonProps={{ disabled: isLoading }}
      title={title}
      content={
        <Box padding="SP4">
          <Text>{message}</Text>
        </Box>
      }
    />
  );
};

export default SaveConfirmationModal;
