import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
import { getLangCode } from "../../../utils/content";
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
  DropdownLayoutValueOption,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { width, height } from "./modal.json";
import { items } from "@wix/data";
import { FAQItem } from "../../../types";
import SaveConfirmationModal from "../../../components/SaveConfirmation";

const Modal: FC = () => {
  const [id, setId] = useState<string | null>(null);
  const [faqData, setFaqData] = useState<FAQItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  // TOPIC OPTIONS
  const topicOptions = [
    { id: 1, value: "Training" },
    { id: 2, value: "Admin" },
    { id: 3, value: "Payment" },
    { id: 4, value: "Packages" },
  ];

  useEffect(() => {
    const subscription = dashboard.observeState((params: { id: string }) => {
      const currentId = params.id;
      if (!currentId) return;

      setId(currentId);

      async function getRowData() {
        try {
          const result = await items.query("faq").find();
          const match = result.items.find((item) => item._id === currentId);

          if (!match) {
            console.error(`No FAQ found for ID: ${currentId}`);
            setFaqData(null);
            return;
          }

          const formatted: FAQItem = {
            id: match._id,
            question: match.question,
            answer: match.answer,
            topic: match.topic,
            order: match.order,
            language: match.language,
            title: match.title,
          };
          setFaqData(formatted);
          setContentKey((prev) => prev + 1);
        } catch (error) {
          console.error("Error fetching FAQ: ", error);
          setFaqData(null);
        }
      }

      getRowData();
    });

    return () => subscription.disconnect();
  }, []);

  // UPDATE FIELDS AS TYPING
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!faqData) return;
    setFaqData({ ...faqData, question: e.target.value });
  };

  const handleAnswerChange = (newAnswer: string) => {
    if (!faqData) return;
    setFaqData({ ...faqData, answer: newAnswer });
  };

  const handleTopicChange = (option: DropdownLayoutValueOption) => {
    if (!faqData) return;
    setFaqData({ ...faqData, topic: String(option.value) });
  };

  const handleLanguageChange = (option: DropdownLayoutValueOption) => {
    if (!faqData) return;
    setFaqData({ ...faqData, language: String(option.value) });
  };

  // LANGUAGE OPTIONS
  const languageOptions = [
    { id: 1, value: "English" },
    { id: 2, value: "German" },
  ];

  // HANDLES FOR SAVING & CANCELLING
  const handleClickSave = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!id || !faqData) return;

    setIsSaving(true);

    try {
      const langCode = getLangCode(faqData.language);

      await items
        .patch("faq", id)
        .setField("question", faqData.question)
        .setField("answer", faqData.answer)
        .setField("topic", faqData.topic)
        .setField("language", faqData.language)
        .setField("title", `${faqData.order}-${langCode}`)
        .run();

      dashboard.showToast({
        message: "Your changes were saved.",
        type: "success",
      });

      dashboard.closeModal({ saved: true });
    } catch (error) {
      console.error("Error saving FAQ: ", error);

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

  if (!faqData) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Box padding="SP4">
          <Text>Loading...</Text>
        </Box>
      </WixDesignSystemProvider>
    );
  }

  const selectedTopic = topicOptions.find(
    (option) => option.value === faqData.topic
  );

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      {showConfirmation ? (
        <SaveConfirmationModal
          message="Are you sure you want to save these changes? They will be live immediately."
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
          title="Edit FAQ"
          subtitle="Update the question, answer, or topic for this FAQ item."
          content={
            <Layout gap="20px">
              <Cell span={12}>
                <FormField label="Question">
                  <InputArea
                    value={faqData.question}
                    onChange={handleQuestionChange}
                    autoGrow
                    minRowsAutoGrow={2}
                  />
                </FormField>
              </Cell>
              <Cell span={12}>
                <FormField label="Answer">
                  <RichTextInputArea
                    key={`answer-${faqData.id}-${contentKey}`}
                    minHeight="120px"
                    initialValue={faqData.answer}
                    onChange={handleAnswerChange}
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Topic">
                  <Dropdown
                    placeholder="Select a topic"
                    options={topicOptions}
                    selectedId={selectedTopic?.id}
                    onSelect={handleTopicChange}
                    popoverProps={{
                      appendTo: "window",
                      placement: "top",
                    }}
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Language">
                  <Dropdown
                    placeholder="Select a language"
                    options={languageOptions}
                    selectedId={languageOptions.find((opt) => opt.value === faqData.language)?.id}
                    onSelect={handleLanguageChange}
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
