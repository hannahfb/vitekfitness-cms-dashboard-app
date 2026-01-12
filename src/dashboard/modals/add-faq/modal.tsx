import React, { type FC, useState } from "react";
import { dashboard } from "@wix/dashboard";
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
  RichTextInputArea,
  Layout,
  Cell,
  FormField,
  InputArea,
  Dropdown,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { width, height } from "./modal.json";
import { items } from "@wix/data";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('c5153ad5-18b0-4d22-a88c-542405a59b99')}>Open Modal</button>;
// }
const Modal: FC = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // TOPIC OPTIONS
  const topicOptions = [
    { id: 1, value: "Training" },
    { id: 2, value: "Admin" },
    { id: 3, value: "Payment" },
    { id: 4, value: "Packages" },
  ];

  // UPDATE FIELDS AS TYPING
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleAnswerChange = (newAnswer: string) => {
    setAnswer(newAnswer);
  };

  const handleTopicChange = (option: any) => {
    setSelectedTopic(option.id);
  };

  // VALIDATION
  const isFormValid = () => {
    return question.trim() !== "" && answer.trim() !== "" && selectedTopic !== undefined;
  };

  // HANDLES FOR SAVING & CANCELLING
  const handleClickSave = () => {
    if (!isFormValid()) {
      dashboard.showToast({
        message: "Please fill in all fields",
        type: "error",
      });
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);

    try {
      // Get the current max order to add the new item at the end
      const result = await items.query("faq").find();
      const maxOrder = result.items.length > 0 
        ? Math.max(...result.items.map(item => item.order || 0))
        : 0;

      const topicValue = topicOptions.find(opt => opt.id === selectedTopic)?.value;

      await items.insert("faq", {
        question: question.trim(),
        answer: answer,
        topic: topicValue,
        order: maxOrder + 1,
      });

      dashboard.showToast({
        message: "FAQ successfully added.",
        type: "success",
      });

      dashboard.closeModal({ saved: true });
    } catch (error) {
      console.error("Error adding FAQ: ", error);

      dashboard.showToast({
        message: "Failed to add FAQ",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      {showConfirmation ? (
        <SaveConfirmationModal
          message="Are you sure you want to add this FAQ? It will be live immediately."
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          isLoading={isSaving}
          primaryButtonText="Yes, Add"
        />
      ) : (
        <CustomModalLayout
          width={width}
          maxHeight={height}
          primaryButtonText="Add"
          secondaryButtonText="Cancel"
          primaryButtonOnClick={handleClickSave}
          secondaryButtonOnClick={() => dashboard.closeModal()}
          title="Add to FAQ"
          subtitle="Create a new frequently asked question."
          content={
            <Layout gap="20px">
              <Cell span={12}>
                <FormField label="Question" required>
                  <InputArea
                    value={question}
                    onChange={handleQuestionChange}
                    autoGrow
                    minRowsAutoGrow={2}
                    placeholder="Enter the question..."
                  />
                </FormField>
              </Cell>
              <Cell span={12}>
                <FormField label="Answer" required>
                  <RichTextInputArea
                    minHeight="120px"
                    initialValue=""
                    onChange={handleAnswerChange}
                    placeholder="Enter the answer..."
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Topic" required>
                  <Dropdown
                    placeholder="Select a topic"
                    options={topicOptions}
                    selectedId={selectedTopic}
                    onSelect={handleTopicChange}
                    popoverProps={{
                      appendTo: "window",
                      placement: "top",
                    }}
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
