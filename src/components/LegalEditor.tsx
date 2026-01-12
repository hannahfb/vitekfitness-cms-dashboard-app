import React, { type FC, useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Layout,
  Cell,
  FormField,
  Dropdown,
  Input,
  RichTextInputArea,
  Box,
  AutoComplete,
  Loader,
  Radio,
  Heading,
  Text,
} from "@wix/design-system";
import { dashboard } from "@wix/dashboard";
import "@wix/design-system/styles.global.css";
import * as Icons from "@wix/wix-ui-icons-common";
import { items } from "@wix/data";
import { TextItem } from "../types";
import { updateItem } from "../utils/content";

interface TextContentEditorProps {
  textData: TextItem[];
}

const LegalEditor: FC<TextContentEditorProps> = ({ textData }) => {
  const [sectionOptions, setSectionOptions] = useState<
    { id: string; value: string }[]
  >([]);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(
    undefined
  );
  const [checkedId, setCheckedId] = useState<number | undefined>(undefined);
  const [content, setContent] = useState({
    id: "",
    title: "",
    section: "",
    header: "",
    content: "",
  });
  const [contentKey, setContentKey] = useState(0);

  const originalItem = useMemo(() => {
    return textData.find((item) => item.id === content.id);
  }, [textData, content.id]);

  useEffect(() => {
    if (!textData.length) return;

    const uniqueSections = Array.from(
      new Set(textData.map((item) => item.section))
    );

    const sectionList = uniqueSections.map((section) => ({
      id: section,
      value: section,
    }));

    setSectionOptions(sectionList);
  }, [textData]);

  // SECTION SELECTORS & CLEARERS
  const handleRadioSelect =
    (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCheckedId(id);
      handleSelectSection(id);
    };

  const handleSelectSection = (id: number) => {
    setCheckedId(id);

    const sectionMap: { [key: number]: string } = {
      1: "Impressum",
      2: "Privacy Policy",
    };

    const sectionName = sectionMap[id];

    const selectedItem = textData.find((item) => item.section === sectionName);

    if (!selectedItem) return;

    fillInputDisplay(selectedItem);

    setContentKey((prev) => prev + 1);
  };

  function fillInputDisplay(item: TextItem) {
    setContent({
      id: item.id,
      title: item.title,
      section: item.section,
      header: item.header,
      content: item.content,
    });
  }

  function handleClearSection() {
    setContent({
      id: "",
      title: "",
      section: "",
      header: "",
      content: "",
    });
  }

  const handleRevertContent = () => {
    if (originalItem) {
      fillInputDisplay(originalItem);
      setContentKey((prev) => prev + 1);
    }
  };

  // TITLE & CONTENT CHANGES
  const handleContentChange = (
    newContent: string,
    field: keyof typeof content
  ) => {
    setContent((prev) => ({ ...prev, [field]: newContent }));
  };

  async function patch() {
    try {
      const updatedItem = await items
        .patch("text", content.id)
        .setField("header", content.header)
        .setField("content", content.content)
        .run();

      return updatedItem;
    } catch (error) {
      console.error("Patch failed: ", error);
      throw error;
    }
  }

  // CHECK FIELD FOR VALIDATION OR ERRORS
  const isInputValid = () => {
    if (!originalItem) return false;

    const fieldsToValidate: (keyof typeof content)[] = ["header", "content"];

    return fieldsToValidate.every(
      (field) =>
        !originalItem[field] || (content[field] && content[field].trim() !== "")
    );
  };

  const getFieldError = (field: keyof typeof content) => {
    if (!originalItem?.[field]) return false;

    if (field === "content") {
      const strippedContent =
        content[field]?.replace(/<[^>]*>/g, "").trim() || "";
      return strippedContent === "";
    }

    return !content[field] || content[field].trim() === "";
  };

  // SAVE/ UPDATE BUTTON
  const handleSaveTextItem = async () => {
    if (!content) return;

    const result = await dashboard.openModal({
      modalId: "a8f952c2-c46a-4f6e-b129-4a4ae98b8537",
      params: {
        id: content.id,
        header: encodeURIComponent(content.header || ""),
        content: encodeURIComponent(content.content || ""),
      },
    });

    if ((result?.modalClosed as any)?.saved) {
      dashboard.showToast({
        message: "Your changes were saved",
        type: "success",
      });
    }
    };

  return (
    <Layout>
      <Cell span={12}>
        <Card>
          <Card.Header title="Page Section"></Card.Header>
          <Card.Divider />
          <Card.Content>
            <Layout gap="24px">
              <Cell>
                <Radio
                  checked={checkedId === 1}
                  onChange={handleRadioSelect(1)}
                  label={
                    <Box direction="vertical">
                      <Heading size="small">Impressum</Heading>
                      <Text size="small" secondary>
                        Contains your legal notices (always in German).
                      </Text>
                    </Box>
                  }
                />
              </Cell>
              <Cell>
                <Radio
                  checked={checkedId === 2}
                  onChange={handleRadioSelect(2)}
                  label={
                    <Box direction="vertical">
                      <Heading size="small">Privacy Policy</Heading>
                      <Text size="small" secondary>
                        Explains how you use and collect user data. All parties/
                        tools that use this data must be mentioned. (Always in
                        German.)
                      </Text>
                    </Box>
                  }
                />
              </Cell>
            </Layout>
          </Card.Content>
        </Card>
      </Cell>

      <Cell span={12}>
        <Card>
          <Card.Header title={content.section || "Content"}></Card.Header>
          <Card.Divider />
          <Card.Content>
            <Layout>
              <Cell span={4}>
                <FormField
                  label="Header"
                  status={getFieldError("header") ? "error" : undefined}
                  statusMessage={
                    getFieldError("header")
                      ? "Field cannot be empty"
                      : undefined
                  }
                >
                  <Input
                    value={content.header}
                    onChange={(e) =>
                      handleContentChange(e.target.value, "header")
                    }
                  />
                </FormField>
              </Cell>
              <Cell>
                <FormField
                  label="Content"
                  status={getFieldError("content") ? "error" : undefined}
                  statusMessage={
                    getFieldError("content")
                      ? "Field cannot be empty"
                      : undefined
                  }
                >
                  <RichTextInputArea
                    key={`${content.id}-${contentKey}`}
                    minHeight="120px"
                    initialValue={content.content}
                    onChange={(newContent) =>
                      handleContentChange(newContent, "content")
                    }
                  />
                </FormField>
              </Cell>
              <Box gap="20px">
                <Button
                  onClick={handleSaveTextItem}
                  disabled={!isInputValid()}
                >
                  Save
                </Button>
                <Button priority="secondary" onClick={handleRevertContent}>
                  Revert
                </Button>
              </Box>
            </Layout>
          </Card.Content>
        </Card>
      </Cell>
    </Layout>
  );
};

export default LegalEditor;
