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
  Radio,
  Tooltip,
  InputArea,
  Text,
  ImageViewer,
} from "@wix/design-system";
import { dashboard } from "@wix/dashboard";
import "@wix/design-system/styles.global.css";
import { items } from "@wix/data";
import { TextItem, SectionOption, ImageModalResponse, SaveModalResponse } from "../types";
import { convertWixImageUrl } from "../utils/content";

interface TextContentEditorProps {
  textData: TextItem[];
}

const TextContentEditor: FC<TextContentEditorProps> = ({ textData }) => {
  const [sectionData, setSectionData] = useState<TextItem[]>([]);

  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);
  const [showCardOptions, setShowCardOptions] = useState(false);
  const [selectedSection, setSelectedSection] = useState<
    SectionOption | undefined
  >(undefined);

  const [checkedId, setCheckedId] = useState<number>(1);

  const [content, setContent] = useState({
    id: "",
    title: "",
    subtype: "",
    header: "",
    content: "",
    section: "",
    page: "",
    primaryButton: "",
    image: null as TextItem["image"],
    imageAltText: "",
  });
  const [cardContent, setCardContent] = useState<TextItem[]>([]);
  const [contentKey, setContentKey] = useState(0);

  const originalItem = useMemo(() => {
    return textData.find((item) => item.id === content.id);
  }, [textData, content.id]);

  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!textData.length) return;

    const uniqueSections = Array.from(
      new Set(textData.map((item) => item.section)),
    );

    const sectionList = uniqueSections.map((section, index) => {
      const count = textData.filter((item) => item.section === section).length;
      return {
        id: index + 1,
        value: section,
        count: count,
      };
    });

    setSectionOptions(sectionList);
  }, [textData]);

  useEffect(() => {
    if (content.image) {
      const dimensions = getImageDimensions(content.image);
      setImageDimensions(dimensions);
    } else {
      setImageDimensions({ width: 0, height: 0 });
    }
  }, [content.image]);

  // SECTION SELECTORS & CLEARERS
  const handleSelectSection = (option: SectionOption) => {
    setSelectedSection(option);
    setCheckedId(1);

    const filteredSectionData = textData.filter(
      (item) => item.section === option.value,
    );
    setSectionData(filteredSectionData);

    let selectedItem;

    if (option.count > 1) {
      setShowCardOptions(true);
      selectedItem = filteredSectionData.find(
        (item) => item.subtype === "Standard",
      );
    } else {
      setShowCardOptions(false);
      setCheckedId(1);
      selectedItem = filteredSectionData[0];
    }

    if (!selectedItem) return;

    fillInputDisplay(selectedItem);
  };

  // TOGGLE BETWEEN STANDARD & CARD SUBSECTIONS
  const handleCardClicked = () => {
    setCheckedId(2);

    const cardItems = sectionData
      .filter((item) => item.subtype === "Card")
      .sort((a, b) => a.cardOrder - b.cardOrder);

    setCardContent(cardItems);

    const card = cardItems[0];
    if (card) {
      fillInputDisplay(card);
    }
  };

  const handleStandardClicked = () => {
    setCheckedId(1);

    const standardItem = sectionData.find(
      (item) => item.subtype === "Standard",
    );

    if (standardItem) {
      fillInputDisplay(standardItem);
    }
  };

  // DISPLAY FUNCTIONS
  const handleDisplayCard = (card: TextItem) => {
    fillInputDisplay(card);
  };

  function fillInputDisplay(item: TextItem) {
    setContent({
      id: item.id,
      title: item.title,
      subtype: item.subtype,
      header: item.header,
      content: item.content,
      section: item.section,
      page: item.page,
      primaryButton: item.primaryButton,
      image: item.image,
      imageAltText: item.imageAltText,
    });
  }

  const getImageDimensions = (wixUrl: string | null) => {
    if (!wixUrl) return { width: 0, height: 0 };

    const width = wixUrl.match(/originWidth=(\d+)/);
    const height = wixUrl.match(/originHeight=(\d+)/);

    return {
      width: width ? parseInt(width[1]) : 0,
      height: height ? parseInt(height[1]) : 0,
    };
  };

  // OPEN IMAGE UPDATE MODAL
  const handleUpdateImage = async () => {
    let currentImage = content.image;
    let currentAltText = content.imageAltText;

    while (true) {
      const dimensions = getImageDimensions(currentImage);

      const result = await dashboard.openModal({
        modalId: "73c35a91-c02c-436e-b640-5118da5cc5a2",
        params: {
          id: content.id,
          image: encodeURIComponent(currentImage || ""),
          imageAltText: encodeURIComponent(currentAltText || ""),
          imageWidth: dimensions.width.toString(),
          imageHeight: dimensions.height.toString(),
        },
      });

      const modalData = (await result?.modalClosed) as ImageModalResponse | undefined;

      // OPENS WIX MEDIA MANAGER MODAL
      if (modalData?.action === "openMediaManager") {
        try {
          const mediaResult = await dashboard.openMediaManager({
            category: "IMAGE",
            multiSelect: false,
          });

          if (mediaResult?.items && mediaResult.items.length > 0) {
            const selectedMedia = mediaResult.items[0];
            const wixImageUri = selectedMedia.media?.image?.image;

            if (wixImageUri) {
              currentImage = wixImageUri;
              currentAltText = modalData?.altText || currentAltText;
              continue;
            }
          }

          continue;
        } catch (error) {
          console.error("Error with Media Manager:", error);
          break;
        }
      }

      if (modalData?.saved) {
        const newImageUrl = modalData?.newImageUrl;
        const newAltText = modalData?.altText;

        if (
          newImageUrl &&
          (newImageUrl !== content.image || newAltText !== content.imageAltText)
        ) {
          try {
            await items
              .patch("text", content.id)
              .setField("image", newImageUrl)
              .setField("imageAltText", newAltText)
              .run();

            setContent((prev) => ({
              ...prev,
              image: newImageUrl,
              imageAltText: newAltText ?? "",
            }));

            dashboard.showToast({
              message: "Image updated successfully",
              type: "success",
            });
          } catch (error) {
            console.error("Error updating image:", error);
            dashboard.showToast({
              message: "Failed to update image",
              type: "error",
            });
          }
        } else if (newAltText !== content.imageAltText) {
          try {
            await items
              .patch("text", content.id)
              .setField("imageAltText", newAltText)
              .run();

            setContent((prev) => ({ ...prev, imageAltText: newAltText ?? "" }));

            dashboard.showToast({
              message: "Alt text updated successfully",
              type: "success",
            });
          } catch (error) {
            console.error("Error updating alt text:", error);
            dashboard.showToast({
              message: "Failed to update alt text",
              type: "error",
            });
          }
        }
      }

      break;
    }
  };

  const handleRevertContent = () => {
    if (originalItem) {
      fillInputDisplay(originalItem);
      setContentKey((prev) => prev + 1);
    }
  };

  // CONTENT, BUTTON & HEADER CHANGES
  const handleContentChange = (
    newContent: string,
    field: keyof typeof content,
  ) => {
    setContent((prev) => ({ ...prev, [field]: newContent }));
  };

  // CHECK FOR INPUT/ FIELD VALIDATION & ERRORS
  const isInputValid = () => {
    if (!originalItem) return false;

    const fieldsToValidate: (keyof typeof content)[] = [
      "header",
      "content",
      "primaryButton",
    ];

    return fieldsToValidate.every(
      (field) =>
        !originalItem[field] ||
        (content[field] && (content[field] as string).trim() !== ""),
    );
  };

  const getFieldError = (field: keyof typeof content) => {
    if (!originalItem?.[field]) return false;

    if (field === "content") {
      const strippedContent =
        (content[field] as string)?.replace(/<[^>]*>/g, "").trim() || "";
      return strippedContent === "";
    }

    return !content[field] || (content[field] as string).trim() === "";
  };

  // SAVE/ UPDATE BUTTON
  const handleSaveClick = async () => {
    const result = await dashboard.openModal({
      modalId: "a8f952c2-c46a-4f6e-b129-4a4ae98b8537",
      params: {
        id: content.id,
        header: encodeURIComponent(content.header || ""),
        content: encodeURIComponent(content.content || ""),
      },
    });

    const saveResult = (await result?.modalClosed) as SaveModalResponse | undefined;
    if (saveResult?.saved) {
      dashboard.showToast({
        message: "Your changes were saved",
        type: "success",
      });
    }
  };

  return (
    <Layout alignItems="stretch">
      <Cell span={checkedId === 2 ? 6 : 12}>
        <Card>
          <Card.Header title="Page Section"></Card.Header>
          <Card.Divider />
          <Card.Content>
            <Layout gap="24px">
              <Cell span={checkedId === 2 ? 6 : 3}>
                <FormField label="Section">
                  <Dropdown
                    placeholder="Select"
                    options={sectionOptions}
                    selectedId={selectedSection?.id}
                    onSelect={(option) => handleSelectSection(option as SectionOption)}
                  />
                </FormField>
              </Cell>
              {showCardOptions && (
                <Cell span={6}>
                  <FormField
                    label={
                      <Tooltip content="Choose between standard text in sections or card-based layouts.">
                        <span>Section Type</span>
                      </Tooltip>
                    }
                  >
                    <Box direction="horizontal" gap="SP4">
                      <Radio
                        checked={checkedId === 1}
                        onChange={handleStandardClicked}
                        label="Standard"
                      />
                      <Radio
                        checked={checkedId === 2}
                        onChange={handleCardClicked}
                        label="Card"
                      />
                    </Box>
                  </FormField>
                </Cell>
              )}
            </Layout>
          </Card.Content>
        </Card>
      </Cell>
      {checkedId === 2 && (
        <Cell span={6}>
          <Card stretchVertically={true}>
            <Card.Header title="Card Selection"></Card.Header>
            <Card.Divider />
            <Card.Content>
              <Layout gap="24px">
                <Cell span={12}>
                  <FormField label="Card number">
                    <Box direction="horizontal" gap="SP4">
                      {cardContent.map((card) => (
                        <Radio
                          key={card.id}
                          checked={content.id === card.id}
                          onChange={() => handleDisplayCard(card)}
                          label={`Card ${card.cardOrder}`}
                        />
                      ))}
                    </Box>
                  </FormField>
                </Cell>
              </Layout>
            </Card.Content>
          </Card>
        </Cell>
      )}
      <Cell span={originalItem?.image ? 8 : 12}>
        <Card>
          <Card.Header title="Content"></Card.Header>
          <Card.Divider />
          <Card.Content>
            <Box height="SP4" />
            <Layout>
              <Cell span={4}>
                <FormField label="Header">
                  {originalItem?.header ? (
                    <InputArea
                      key={`header-${content.id}-${contentKey}`}
                      value={content.header || ""}
                      onChange={(e) =>
                        handleContentChange(e.target.value, "header")
                      }
                      autoGrow
                      minRowsAutoGrow={1}
                      status={getFieldError("header") ? "error" : undefined}
                      statusMessage={
                        getFieldError("header")
                          ? "Field cannot be empty"
                          : undefined
                      }
                    />
                  ) : (
                    <Input readOnly placeholder="No content available" />
                  )}
                </FormField>
              </Cell>
              {originalItem?.primaryButton && (
                <Cell span={4}>
                  <FormField label="Button Text">
                    <Input
                      value={content.primaryButton || ""}
                      onChange={(e) =>
                        handleContentChange(e.target.value, "primaryButton")
                      }
                      status={
                        getFieldError("primaryButton") ? "error" : undefined
                      }
                      statusMessage={
                        getFieldError("primaryButton")
                          ? "Field cannot be empty"
                          : undefined
                      }
                    />
                  </FormField>
                </Cell>
              )}
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
                  {originalItem?.content ? (
                    <RichTextInputArea
                      key={`${content.id}-${contentKey}`}
                      minHeight="120px"
                      initialValue={content.content}
                      onChange={(newContent) =>
                        handleContentChange(newContent, "content")
                      }
                    />
                  ) : (
                    <Input readOnly placeholder="No content available" />
                  )}
                </FormField>
              </Cell>
              <Box gap="20px">
                <Button onClick={handleSaveClick} disabled={!isInputValid()}>
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
      {originalItem?.image && (
        <Cell span={4}>
          <Card stretchVertically={true}>
            <Card.Header title="Image" />
            <Card.Divider />
            <Card.Content>
              <Box height="SP4" />
              <Layout gap="24px">
                <Cell span={12}>
                  <Cell span={4}>
                    <FormField>
                      <ImageViewer
                        imageUrl={convertWixImageUrl(content.image) || ""}
                        height="100%"
                        width="100%"
                        showRemoveButton={false}
                        onUpdateImage={handleUpdateImage}
                      />
                    </FormField>
                  </Cell>
                  <Tooltip content="Please only upload images with the same dimensions.">
                    <Text size="small">
                      Dimensions: {getImageDimensions(content.image).width}x
                      {getImageDimensions(content.image).height} px
                    </Text>
                  </Tooltip>
                </Cell>
                <Cell span={12}>
                  <FormField label="Alt text">
                    <InputArea
                      value={content.imageAltText || ""}
                      onChange={(e) =>
                        handleContentChange(e.target.value, "imageAltText")
                      }
                      autoGrow
                      minRowsAutoGrow={1}
                      status={
                        getFieldError("imageAltText") ? "error" : undefined
                      }
                      statusMessage={
                        getFieldError("imageAltText")
                          ? "Field cannot be empty"
                          : undefined
                      }
                    />
                  </FormField>
                </Cell>
              </Layout>
            </Card.Content>
          </Card>
        </Cell>
      )}
    </Layout>
  );
};

export default TextContentEditor;
