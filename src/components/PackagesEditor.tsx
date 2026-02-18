import React, { type FC, useState, useEffect, useMemo } from "react";
import { dashboard } from "@wix/dashboard";
import {
  Card,
  Layout,
  Cell,
  FormField,
  Dropdown,
  Box,
  Table,
  TableActionCell,
  TableToolbar,
  TagList,
  Heading,
  Text,
  IconButton,
  Tooltip,
  DropdownLayoutValueOption,
  TableColumn,
  Input,
  InputArea,
  RichTextInputArea,
  Button,
  ImageViewer,
  SectionHeader,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import {
  PackageItem,
  SortKey,
  TypeOption,
  SessionOption,
  FilterTag,
  FilterOption,
  ModalResult,
  TextItem,
  ImageItem,
  SaveModalResponse,
  ImageModalResponse,
} from "../types";
import { items } from "@wix/data";
import { Edit as EditIcon } from "@wix/wix-ui-icons-common";
import {
  convertWixImageUrl,
  getImageDimensions,
  reformatHtmlTags,
} from "../utils/content";

interface PackagesEditorProps {
  packagesData: PackageItem[];
  textData: TextItem[];
  imageData: ImageItem[];
  selectedLang: string;
  onDataChange: () => Promise<void>;
}

const PackagesEditor: FC<PackagesEditorProps> = ({
  packagesData,
  textData,
  imageData,
  selectedLang,
  onDataChange,
}) => {
  const [sortedPackData, setSortedPackData] = useState<PackageItem[]>([
    ...packagesData,
  ]);
  const [pricingContentData, setPricingContentData] = useState<TextItem[]>([]);
  const [descriptions, setDescriptions] = useState<TextItem[]>([]);
  const typeOrder = ["Quick 40", "Standard 60", "Extended 75"];

  // RESOLVE IMAGE URL FROM IMAGEREF ID
  const resolveImageUrl = (imageRef: string | null): string | null => {
    if (!imageRef) return null;
    const match = imageData.find((img) => img.id === imageRef);
    return match?.image || null;
  };

  useEffect(() => {
    setSortedPackData([...packagesData]);
  }, [packagesData]);

  // DESCRIPTION ROWS FROM TEXT COLLECTION, FILTERED BY LANGUAGE
  useEffect(() => {
    const filteredDescriptions = textData
      .filter((item) => typeOrder.includes(item.section) && item.language === selectedLang)
      .sort((a, b) => typeOrder.indexOf(a.section) - typeOrder.indexOf(b.section));

    setDescriptions(filteredDescriptions);
  }, [textData, selectedLang]);

  // SWAP CONTENT TO EQUIVALENT ITEM WHEN LANGUAGE CHANGES
  useEffect(() => {
    if (selectedContent.id === 0 || !content.id) return;

    const item = textData.find(
      (item) => item.section === content.section && item.language === selectedLang,
    );

    if (item) {
      setContent({
        id: item.id,
        title: item.title,
        header: item.header,
        content: item.content,
        section: item.section,
        imageRef: item.imageRef || null,
        imageAltText: item.imageAltText || "",
      });
      setContentKey((prev) => prev + 1);
    }
  }, [selectedLang]);

  // PACKAGE DESCRIPTIONS
  // MODAL FUNCTION TO EDIT DESCRIPTIONS
  const handleEditDescription = async (descriptionId: string, type: string) => {
    try {
      const result = await dashboard.openModal({
        modalId: "bb733afb-b807-4811-9122-04428fb97dd9",
        params: { id: descriptionId, type: type },
      });

      const modalResult = (await result?.modalClosed) as ModalResult;

      if (modalResult?.saved) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error editing description:", error);
      dashboard.showToast({
        message: "Failed to edit description",
        type: "error",
      });
    }
  };

  // CONTENT FILTER VARIABLES
  const contentOptions: TypeOption[] = [
    { id: 0, value: "Descriptions", type: "content" },
    { id: 1, value: "Intro Text", type: "content" },
    { id: 2, value: "Intro Banner", type: "content" },
    { id: 3, value: "5 Sessions", type: "content" },
    { id: 4, value: "10 Sessions", type: "content" },
    { id: 5, value: "20 Sessions", type: "content" },
    { id: 6, value: "Nutritional Coaching", type: "content" },
    { id: 7, value: "Nutritional Consultation", type: "content" },
    { id: 8, value: "Meal Plan", type: "content" },
    { id: 9, value: "Dance Discount Banner", type: "content" },
    { id: 10, value: "App", type: "content" },
    { id: 11, value: "Trial", type: "content" },
    { id: 12, value: "Consult", type: "content" },
    { id: 13, value: "Form", type: "content" },
  ];

  // CONTENT SORTING
  const sectionMapping: Record<number, string> = {
    1: "Features",
    2: "Intro Banner",
    3: "5 Sessions",
    4: "10 Sessions",
    5: "20 Sessions",
    6: "Nutritional Coaching",
    7: "Nutrition",
    8: "Meal Plan",
    9: "Dance",
    10: "App",
    11: "Trial",
    12: "Consult",
    13: "Form",
  };

  const handleContentSelect = (option: DropdownLayoutValueOption) => {
    const selected = contentOptions[option.id as number];
    setSelectedContent(selected);

    if (option.id === 0) return;

    const sectionName = sectionMapping[option.id as number];
    const item = textData.find((item) => item.section === sectionName && item.language === selectedLang);

    if (item) {
      setContent({
        id: item.id,
        title: item.title,
        header: item.header,
        content: item.content,
        section: item.section,
        imageRef: item.imageRef || null,
        imageAltText: item.imageAltText || "",
      });
    }
  };

  // PRICING FILTER VARIABLES
  const typeOptions: TypeOption[] = [
    { id: 0, value: "All Types", type: "type" },
    { id: 1, value: "Quick 40", type: "type" },
    { id: 2, value: "Standard 60", type: "type" },
    { id: 3, value: "Extended 75", type: "type" },
    { id: 4, value: "Nutritional", type: "type" },
  ];

  const sessionOptions: SessionOption[] = [
    { id: 0, value: "All Sessions", qty: 0, type: "session" },
    { id: 1, value: "5 Sessions", qty: 5, type: "session" },
    { id: 2, value: "10 Sessions", qty: 10, type: "session" },
    { id: 3, value: "20 Sessions", qty: 20, type: "session" },
  ];

  // STATES FOR TRACKING TABLE SORTING
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // STATES FOR TRACKING FILTER SELECTION
  const [selectedSession, setSelectedSession] = useState(sessionOptions[0]);
  const [selectedType, setSelectedType] = useState(typeOptions[0]);
  const [selectedContent, setSelectedContent] = useState(contentOptions[0]);

  const [subtoolbarVisible, setSubtoolbarVisible] = useState(false);
  const [filters, setFilters] = useState<FilterTag[]>([]);

  // CONTENT EDITING STATE
  const [content, setContent] = useState({
    id: "",
    title: "",
    header: "",
    content: "",
    section: "",
    imageRef: null as string | null,
    imageAltText: "",
  });
  const [contentKey, setContentKey] = useState(0);

  const originalItem = useMemo(() => {
    return textData.find((item) => item.id === content.id);
  }, [textData, content.id]);

  const resolvedImageUrl = resolveImageUrl(content.imageRef);

  const imageDimensions = useMemo(
    () => getImageDimensions(resolvedImageUrl),
    [resolvedImageUrl]
  );

  const handleContentChange = (
    newContent: string,
    field: keyof typeof content,
  ) => {
    setContent((prev) => ({ ...prev, [field]: newContent }));
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

    const isInputValid = () => {
    if (!originalItem) return false;

    const fieldsToValidate: (keyof typeof content)[] = ["header", "content"];

    return fieldsToValidate.every(
      (field) =>
        !originalItem[field] ||
        (content[field] && (content[field] as string).trim() !== ""),
    );
  };

  const handleRevertContent = () => {
    if (originalItem) {
      setContent({
        id: originalItem.id,
        title: originalItem.title,
        header: originalItem.header,
        content: originalItem.content,
        section: originalItem.section,
        imageRef: originalItem.imageRef || null,
        imageAltText: originalItem.imageAltText || "",
      });
      setContentKey((prev) => prev + 1);
    }
  };

  const handleSaveClick = async () => {
    const result = await dashboard.openModal({
      modalId: "a8f952c2-c46a-4f6e-b129-4a4ae98b8537",
      params: {
        id: content.id,
        header: encodeURIComponent(content.header || ""),
        content: encodeURIComponent(content.content || ""),
      },
    });

    const saveResult = (await result?.modalClosed) as
      | SaveModalResponse
      | undefined;
    if (saveResult?.saved) {
      dashboard.showToast({
        message: "Your changes were saved",
        type: "success",
      });
    }
  };

  const handleUpdateImage = async () => {
    let currentImage = resolveImageUrl(content.imageRef);
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

      const modalData = (await result?.modalClosed) as
        | ImageModalResponse
        | undefined;

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
        const currentResolvedImage = resolveImageUrl(content.imageRef);
        const imageChanged = newImageUrl && newImageUrl !== currentResolvedImage;
        const altTextChanged = newAltText !== content.imageAltText;

        try {
          // IMAGE URL CHANGED — PATCH IMAGES COLLECTION
          if (imageChanged && content.imageRef) {
            await items
              .patch("images", content.imageRef)
              .setField("image", newImageUrl)
              .run();
          }

          // ALT TEXT CHANGED — PATCH TEXT COLLECTION
          if (altTextChanged) {
            await items
              .patch("text", content.id)
              .setField("imageAltText", newAltText)
              .run();

            setContent((prev) => ({ ...prev, imageAltText: newAltText ?? "" }));
          }

          if (imageChanged || altTextChanged) {
            await onDataChange();
            dashboard.showToast({
              message: "Image updated successfully",
              type: "success",
            });
          }
        } catch (error) {
          console.error("Error updating image:", error);
          dashboard.showToast({
            message: "Failed to update image",
            type: "error",
          });
        }
      }

      break;
    }
  };

  const compileFilters = (
    typeSelection: TypeOption,
    sessionSelection: SessionOption,
  ) => {
    const newFilters: FilterTag[] = [];

    if (typeSelection.value !== "All Types") {
      newFilters.push({ id: "type", children: String(typeSelection.value) });
    }

    if (sessionSelection.value !== "All Sessions") {
      newFilters.push({
        id: "session",
        children: String(sessionSelection.value),
      });
    }

    return newFilters;
  };

  const handleFilterSelection = (option: FilterOption) => {
    let newSelectedType: TypeOption = selectedType;
    let newSelectedSession: SessionOption = selectedSession;
    let filtered: PackageItem[];

    if (option.type === "type") newSelectedType = option;
    if (option.type === "session") newSelectedSession = option;

    if (
      newSelectedType.value === "All Types" &&
      newSelectedSession.value === "All Sessions"
    ) {
      filtered = packagesData;
    } else {
      filtered = packagesData.filter((item) => {
        switch (option.type) {
          case "type":
            if (option.value === "All Types") {
              return (
                selectedSession.id === 0 ||
                item.sessionQty === selectedSession.qty
              );
            } else {
              return (
                item.type === option.value &&
                (selectedSession.id === 0 ||
                  item.sessionQty === selectedSession.qty)
              );
            }

          case "session":
            if (option.value === "All Sessions") {
              return selectedType.id === 0 || item.type === selectedType.value;
            } else {
              return (
                item.sessionQty === option.qty &&
                (selectedType.id === 0 || item.type === selectedType.value)
              );
            }
          default:
            return true;
        }
      });
    }
    const newFilters = compileFilters(newSelectedType, newSelectedSession);

    checkFiltersLength(newFilters);

    setSelectedType(newSelectedType);
    setSelectedSession(newSelectedSession);
    setSortedPackData(filtered);
    setFilters(newFilters);
  };

  const handleTypeSelect = (
    option: DropdownLayoutValueOption,
    sameOptionWasPicked: boolean,
  ) => {
    if (sameOptionWasPicked) return;
    const selected = typeOptions.find((o) => o.id === option.id);
    if (selected) handleFilterSelection(selected);
  };

  const handleSessionSelect = (
    option: DropdownLayoutValueOption,
    sameOptionWasPicked: boolean,
  ) => {
    if (sameOptionWasPicked) return;
    const selected = sessionOptions.find((o) => o.id === option.id);
    if (selected) handleFilterSelection(selected);
  };

  const removeTag = (tag: string) => {
    let newSelectedType: TypeOption = selectedType;
    let newSelectedSession: SessionOption = selectedSession;

    if (tag === "type") {
      newSelectedType = {
        id: 0,
        value: "All Types",
        type: "type",
      };
      setSelectedType(newSelectedType);
    } else if (tag === "session") {
      newSelectedSession = {
        id: 0,
        value: "All Sessions",
        qty: 0,
        type: "session",
      };
      setSelectedSession(newSelectedSession);
    }

    const updatedFilters = filters.filter((f) => f.id !== tag);
    setFilters(updatedFilters);
    checkFiltersLength(updatedFilters);

    let filteredData;

    if (updatedFilters.length === 0) {
      filteredData = packagesData;
    } else if (updatedFilters.length > 0) {
      filteredData = packagesData.filter((item) => {
        return (
          (newSelectedType.value === "All Types" ||
            item.type === selectedType.value) &&
          (newSelectedSession.value === "All Sessions" ||
            item.sessionQty === selectedSession.qty)
        );
      });
    }
    setSortedPackData(filteredData || []);
  };

  const clearAll = () => {
    setFilters([]);
    setSortedPackData(packagesData);
    setSelectedSession(sessionOptions[0]);
    setSelectedType(typeOptions[0]);
    setSubtoolbarVisible(false);
  };

  function checkFiltersLength(newFilters: FilterTag[]) {
    setSubtoolbarVisible(newFilters.length > 0);
  }

  // SORTING
  const handleSortClick = (
    _colData: TableColumn<PackageItem>,
    colNum: number,
  ) => {
    let key: keyof PackageItem;

    switch (colNum) {
      case 0:
        key = "type";
        break;
      case 1:
        key = "sessionQty";
        break;
      case 2:
        key = "sessionPrice";
        break;
      case 3:
        key = "totalPrice";
        break;
      case 4:
        key = "validity";
        break;
      default:
        return;
    }

    const newDirection =
      sortBy?.key === key ? (sortDirection === "asc" ? "desc" : "asc") : "asc";

    setSortBy({ key });
    setSortDirection(newDirection);

    const sorted = [...sortedPackData].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      let result = 0;

      if (typeof valA === "string" && typeof valB === "string") {
        result = valA.localeCompare(valB);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        result = valA - valB;
      }
      return newDirection === "asc" ? result : -result;
    });

    setSortedPackData(sorted);
  };

  // EDIT BUTTON
  const handleEdit = async (row: PackageItem) => {
    try {
      const result = await dashboard.openModal({
        modalId: "8165bb05-e4cc-48cd-bc95-2b36f72a96ef",
        params: { id: row.id },
      });

      const modalResult = (await result?.modalClosed) as ModalResult;

      if (modalResult?.saved) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error editing package:", error);
      dashboard.showToast({
        message: "Failed to edit package",
        type: "error",
      });
    }
  };

  // TABLE VARIABLES
  const columns = [
    {
      id: 0,
      title: "Type",
      width: "20%",
      render: (row: PackageItem) => row.type,
      sortable: true,
      sortDescending:
        sortBy?.key === "type" ? sortDirection === "desc" : undefined,
    },
    {
      id: 1,
      title: "Sessions",
      width: "25%",
      render: (row: PackageItem) => `${row.sessionQty} Sessions`,
      sortable: true,
      sortDescending:
        sortBy?.key === "sessionQty" ? sortDirection === "desc" : undefined,
    },
    {
      id: 2,
      title: "Session Price",
      width: "15%",
      render: (row: PackageItem) => `${row.sessionPrice} €`,
      sortable: true,
      sortDescending:
        sortBy?.key === "sessionPrice" ? sortDirection === "desc" : undefined,
    },
    {
      id: 3,
      title: "Total",
      width: "15%",
      render: (row: PackageItem) => `${row.totalPrice} €`,
      sortable: true,
      sortDescending:
        sortBy?.key === "totalPrice" ? sortDirection === "desc" : undefined,
    },
    {
      id: 4,
      title: "Validity",
      width: "20%",
      render: (row: PackageItem) => `${row.validity} Months`,
      sortable: true,
      sortDescending:
        sortBy?.key === "validity" ? sortDirection === "desc" : undefined,
    },
    {
      id: 5,
      title: "",
      width: "5%",
      render: (row: PackageItem) => (
        <TableActionCell
          primaryAction={{
            text: "Edit",
            onClick: () => handleEdit(row),
          }}
        />
      ),
    },
  ];

  return (
    <Layout>
      <Cell span={selectedContent.id !== 0 && resolvedImageUrl ? 8 : 12}>
        <Card>
          <TableToolbar>
            <TableToolbar.ItemGroup>
              <TableToolbar.Item>
                <TableToolbar.Title>Content</TableToolbar.Title>
              </TableToolbar.Item>
            </TableToolbar.ItemGroup>
            <TableToolbar.ItemGroup>
              <TableToolbar.Item>
                <FormField>
                  <Dropdown
                    size="small"
                    border="round"
                    selectedId={selectedContent.id}
                    options={contentOptions}
                    onSelect={handleContentSelect}
                  />
                </FormField>
              </TableToolbar.Item>
            </TableToolbar.ItemGroup>
          </TableToolbar>
          <Card.Divider />
          <SectionHeader title={`${selectedContent.value} section`} />
          <Card.Content>
            {selectedContent.id === 0 ? (
              <Layout>
                {descriptions.map((desc, index) => (
                  <Cell key={desc?.id || index} span={4}>
                    <Box direction="horizontal" gap="SP" verticalAlign="top">
                      <Box direction="vertical" gap="SP1" flexGrow={1}>
                        <Heading size="small">{desc?.section}</Heading>
                        {desc?.header && (
                          <Text size="small" weight="bold">
                            {desc.header}
                          </Text>
                        )}
                        <Text size="small">
                          {reformatHtmlTags(desc?.content || "")}
                        </Text>
                      </Box>
                      <Tooltip content="Edit description">
                        <IconButton
                          priority="secondary"
                          onClick={() =>
                            handleEditDescription(desc?.id, desc?.section)
                          }
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Cell>
                ))}
              </Layout>
            ) : (
              <Layout>
                <Cell span={6}>
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
            )}{" "}
          </Card.Content>
        </Card>
      </Cell>
      {selectedContent.id !== 0 && resolvedImageUrl && (
        <Cell span={4}>
          <Card stretchVertically={true}>
            <Card.Header title="Image" />
            <Card.Divider />
            <Card.Content>
              <Box height="SP4" />
              <Layout gap="24px">
                <Cell span={12}>
                  <FormField>
                    <Box align="center">
                      <ImageViewer
                        imageUrl={convertWixImageUrl(resolvedImageUrl) || ""}
                        height="80%"
                        width="80%"
                        showRemoveButton={false}
                        onUpdateImage={handleUpdateImage}
                      />
                    </Box>
                  </FormField>
                  <Box align="center">
                    <Tooltip content="Please only upload images with the same dimensions.">
                      <Text size="small">
                        Dimensions: {imageDimensions.width}x
                        {imageDimensions.height} px
                      </Text>
                    </Tooltip>
                  </Box>
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
                      status={getFieldError("imageAltText") ? "error" : undefined}
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
      <Cell span={12}>
        <Card>
          <Box style={{ overflow: "hidden", borderRadius: "0 0 8px 8px" }}>
            <Table
              data={sortedPackData}
              columns={columns}
              onSortClick={handleSortClick}
            >
              <TableToolbar>
                <TableToolbar.ItemGroup>
                  <TableToolbar.Item>
                    <TableToolbar.Title>Pricing</TableToolbar.Title>
                  </TableToolbar.Item>
                </TableToolbar.ItemGroup>
                <TableToolbar.ItemGroup>
                  <TableToolbar.Item>
                    <FormField>
                      <Dropdown
                        size="small"
                        border="round"
                        selectedId={selectedType.id}
                        options={typeOptions}
                        value={String(selectedType.value)}
                        onSelect={handleTypeSelect}
                      />
                    </FormField>
                  </TableToolbar.Item>
                  <TableToolbar.Item>
                    <FormField>
                      <Dropdown
                        size="small"
                        border="round"
                        selectedId={selectedSession.id}
                        options={sessionOptions}
                        value={String(selectedSession.value)}
                        onSelect={handleSessionSelect}
                      />
                    </FormField>
                  </TableToolbar.Item>
                </TableToolbar.ItemGroup>
              </TableToolbar>
              {subtoolbarVisible && (
                <Table.SubToolbar>
                  <Cell>
                    <FormField label="Filtered by:" labelPlacement="left">
                      <TagList
                        tags={filters}
                        actionButton={{ label: "Clear All", onClick: clearAll }}
                        onTagRemove={removeTag}
                      />
                    </FormField>
                  </Cell>
                </Table.SubToolbar>
              )}
              <Table.Content />
            </Table>
          </Box>
        </Card>
      </Cell>
    </Layout>
  );
};

export default PackagesEditor;
