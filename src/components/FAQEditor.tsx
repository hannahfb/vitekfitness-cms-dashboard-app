import React, { type FC, useState, useEffect } from "react";
import {
  Card,
  Layout,
  Cell,
  Box,
  Text,
  TableActionCell,
  Table,
  TableToolbar,
  Page,
  Button,
  Dropdown,
  Search,
  FormField,
  TagList,
  DropdownLayoutValueOption,
  Image,
  TextButton,
  Pagination,
} from "@wix/design-system";
import { dashboard } from "@wix/dashboard";
import "@wix/design-system/styles.global.css";
import * as Icons from "@wix/wix-ui-icons-common";
import { items } from "@wix/data";
import { FAQItem, ModalResult, FilterTag } from "../types";
import { reformatHtmlTags, getLangCode } from "../utils/content";

interface FAQEditorProps {
  faqData: FAQItem[];
  onDataChange: () => Promise<void>;
  selectedLang: string;
}

const FAQEditor: FC<FAQEditorProps> = ({ faqData, onDataChange, selectedLang }) => {
  const [sortedFAQData, setSortedFAQData] = useState<FAQItem[]>([]);

  const [subtoolbarVisible, setSubtoolbarVisible] = useState(false);
  const [filter, setFilter] = useState<FilterTag[]>([]);
  const [topicOptions, setTopicOptions] = useState<
    { id: number; value: string }[]
  >([]);
  const [selectedTopic, setSelectedTopic] = useState({
    id: 0,
    value: "All Topics",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedFAQData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedFAQData.slice(startIndex, endIndex);

  useEffect(() => {
    if (faqData.length > 0) {
      const uniqueTopics = Array.from(
        new Set(faqData.map((item) => item.topic))
      );

      const options = [
        { id: 0, value: "All Topics" },
        ...uniqueTopics.map((topic, index) => ({
          id: index + 1,
          value: topic,
        })),
      ];

      setTopicOptions(options);
      applyFilters("All Topics", searchQuery);
    }
  }, [faqData, selectedLang]);

  // FILTERING & SEARCHING
  const applyFilters = (topic: string, search: string) => {
    let data = [...faqData]
      .filter((item) => item.language === selectedLang)
      .sort((a, b) => a.order - b.order);

    if (topic !== "All Topics") {
      data = data.filter((item) => item.topic === topic);
    }

    if (search) {
      data = data.filter(
        (item) =>
          item.question.toLowerCase().includes(search) ||
          reformatHtmlTags(item.answer).toLocaleLowerCase().includes(search)
      );
    }

    setSortedFAQData(data);
    setCurrentPage(1);
  };

  const handleTopicSelect = (option: DropdownLayoutValueOption) => {
    const selected = topicOptions.find((topic) => topic.id === option.id);
    if (selected) {
      setSelectedTopic(selected);
      applyFilters(selected.value, searchQuery);

      if (selected.id === 0) {
        setFilter([]);
        setSubtoolbarVisible(false);
      } else {
        setFilter([{ id: "topic", children: selected?.value }]);
        setSubtoolbarVisible(true);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    applyFilters(selectedTopic.value, query);
  };

  // CLEARING FILTERS & SEARCHES
  const handleClearSearch = () => {
    setSearchQuery("");
    applyFilters(selectedTopic.value, "");
  };

  const removeTag = () => {
    setFilter([]);
    setSelectedTopic(topicOptions[0] ?? { id: 0, value: "All Topics" });
    setSubtoolbarVisible(false);
    applyFilters("All Topics", searchQuery);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTopic({ id: 0, value: "All Topics" });
    setFilter([]);
    setSubtoolbarVisible(false);
    applyFilters("All Topics", "");
  };

  // PAGINATION CHANGES
  const handlePageChange = ({
    page,
    event,
  }: {
    page: number;
    event: React.MouseEvent;
  }) => {
    event.preventDefault();
    setCurrentPage(page);
  };

  // EDIT, ADD & DELETE FUNCTIONS
  const handleEdit = async (item: FAQItem) => {
    try {
      const result = await dashboard.openModal({
        modalId: "cad760d8-3d4e-4c37-adee-fddf5f70e9d2",
        params: {
          id: item.id,
        },
      });

      const modalResult = (await result?.modalClosed) as ModalResult;

      if (modalResult?.saved) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error editing FAQ item:", error);
      dashboard.showToast({
        message: "Failed to edit FAQ item",
        type: "error",
      });
    }
  };

  const handleAdd = async () => {
    try {
      const result = await dashboard.openModal({
        modalId: "c5153ad5-18b0-4d22-a88c-542405a59b99",
        params: { language: selectedLang },
      });

      const modalResult = (await result?.modalClosed) as ModalResult;

      if (modalResult?.saved) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error adding FAQ item:", error);
      dashboard.showToast({
        message: "Failed to add FAQ item",
        type: "error",
      });
    }
  };

  const handleDelete = async (item: FAQItem) => {
    try {
      const result = await dashboard.openModal({
        modalId: "37a73e82-eabd-4e01-96f4-b44aa22723c2",
        params: {
          id: item.id,
          question: encodeURIComponent(item.question),
        },
      });

      const modalResult = (await result?.modalClosed) as ModalResult;

      if (modalResult?.deleted) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error deleting FAQ item:", error);
      dashboard.showToast({
        message: "Failed to delete FAQ item",
        type: "error",
      });
    }
  };

  // REORDERING ROWS (MOVING UP & DOWN)
  const moveUp = async (item: FAQItem) => {
    const currentIndex = sortedFAQData.findIndex((faq) => faq.id === item.id);

    if (currentIndex > 0) {
      const aboveItem = sortedFAQData[currentIndex - 1];

      try {
        await items
          .patch("faq", item.id)
          .setField("order", aboveItem.order)
          .setField("title", `${aboveItem.order}-${getLangCode(item.language)}`)
          .run();
        await items
          .patch("faq", aboveItem.id)
          .setField("order", item.order)
          .setField("title", `${item.order}-${getLangCode(aboveItem.language)}`)
          .run();

        await onDataChange();

        dashboard.showToast({
          message: "Item moved up successfully",
          type: "success",
        });
      } catch (error) {
        console.error("Error moving item:", error);
        dashboard.showToast({
          message: "Failed to move item",
          type: "error",
        });
      }
    }
  };

  const moveDown = async (item: FAQItem) => {
    const currentIndex = sortedFAQData.findIndex((faq) => faq.id === item.id);

    if (currentIndex < sortedFAQData.length - 1) {
      const belowItem = sortedFAQData[currentIndex + 1];

      try {
        await items
          .patch("faq", item.id)
          .setField("order", belowItem.order)
          .setField("title", `${belowItem.order}-${getLangCode(item.language)}`)
          .run();
        await items
          .patch("faq", belowItem.id)
          .setField("order", item.order)
          .setField("title", `${item.order}-${getLangCode(belowItem.language)}`)
          .run();

        await onDataChange();

        dashboard.showToast({
          message: "Item moved down successfully",
          type: "success",
        });
      } catch (error) {
        console.error("Error moving item:", error);
        dashboard.showToast({
          message: "Failed to move item",
          type: "error",
        });
      }
    }
  };

    // TOPIC COLOURS
  const topicColors: { [key: string]: string } = {
    Training: "B50",
    Admin: "G50",
    Payment: "P50",
    Packages: "R50",
  };

  // TABLE COLUMNS
  const columns = [
    {
      title: "Question",
      render: (row: FAQItem) => <Text>{row.question}</Text>,
      width: "30%",
    },
    {
      title: "Answer",
      render: (row: FAQItem) => {
        const plainText = reformatHtmlTags(row.answer);
        return (
          <Text secondary>
            {plainText.length > 150
              ? plainText.substring(0, 150) + "..."
              : plainText}
          </Text>
        );
      },
      width: "40%",
    },
    {
      title: "Topic",
      render: (row: FAQItem) => (
        <Box
          backgroundColor={topicColors[row.topic] || "D60"}
          paddingLeft="12px"
          paddingRight="12px"
          paddingTop="6px"
          paddingBottom="6px"
          borderRadius="4px"
          align="center"
          verticalAlign="middle"
        >
          <Text size="small" color="D10">
            {row.topic}
          </Text>
        </Box>
      ),
      width: "15%",
    },
    {
      title: "",
      render: (row: FAQItem) => {
        const currentIndex = sortedFAQData.findIndex(
          (faq) => faq.id === row.id
        );
        if (currentIndex === -1) return null;
        const atTop = currentIndex === 0;
        const atBottom = currentIndex === sortedFAQData.length - 1;

        return (
          <TableActionCell
            size="small"
            primaryAction={{
              text: "Edit",
              onClick: () => handleEdit(row),
            }}
            secondaryActions={[
              ...(!atTop
                ? [
                    {
                      text: "Move up",
                      icon: <Icons.ArrowUp />,
                      onClick: () => {
                        moveUp(row);
                      },
                    },
                  ]
                : []),
              ...(!atBottom
                ? [
                    {
                      text: "Move down",
                      icon: <Icons.ArrowDown />,
                      onClick: () => {
                        moveDown(row);
                      },
                    },
                  ]
                : []),
              {
                text: "Delete",
                icon: <Icons.DeleteSmall />,
                onClick: () => handleDelete(row),
              },
            ]}
            numOfVisibleSecondaryActions={0}
            popoverMenuProps={{
              minWidth: 150,
              placement: 'bottom',
            }}
          />
        );
      },
      width: "15%",
    },
  ];

  return (
    <Layout>
      <Cell span={12}>
        <Box
          direction="horizontal"
          align="space-between"
          verticalAlign="middle"
        >
          <Page.Header title="Questions & Answers" />
          <Button size="medium" prefixIcon={<Icons.Add />} onClick={handleAdd}>
            Add New
          </Button>
        </Box>
      </Cell>
      <Cell span={12}>
        <Table data={paginatedData} columns={columns}>
          <Page.Sticky>
            <Card>
              <TableToolbar>
                <TableToolbar.ItemGroup>
                  <TableToolbar.Item>
                    {sortedFAQData.length > 0 && (
                      <Text size="small">
                        <b>
                          {startIndex + 1}-
                          {Math.min(endIndex, sortedFAQData.length)}
                        </b>{" "}
                        out of {sortedFAQData.length} question
                        {sortedFAQData.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </TableToolbar.Item>
                </TableToolbar.ItemGroup>
                <TableToolbar.ItemGroup position="end">
                  <TableToolbar.Item>
                    <Dropdown
                      size="small"
                      border="round"
                      selectedId={selectedTopic.id}
                      options={topicOptions}
                      value={String(selectedTopic.value)}
                      onSelect={handleTopicSelect}
                    />
                  </TableToolbar.Item>
                  <TableToolbar.Item>
                    <Search
                      size="small"
                      value={searchQuery}
                      onChange={handleSearch}
                      onClear={handleClearSearch}
                    />
                  </TableToolbar.Item>
                </TableToolbar.ItemGroup>
              </TableToolbar>
              {subtoolbarVisible && (
                <Table.SubToolbar>
                  <Cell>
                    <FormField label="Filtered by:" labelPlacement="left">
                      <TagList
                        tags={filter}
                        actionButton={{
                          label: "Clear All",
                          onClick: removeTag,
                        }}
                        onTagRemove={removeTag}
                      />
                    </FormField>
                  </Cell>
                </Table.SubToolbar>
              )}
              <Table.Titlebar />
              {sortedFAQData.length === 0 && (
                <Table.EmptyState
                  title="No search results"
                  subtitle="No items match your search criteria. Try to search by another keyword."
                  image={
                    <Image
                      height={120}
                      width={120}
                      src="https://api.lingoapp.com/v4/assets/6F4EC24D-ED41-4136-8050-837D05883F22/preview?size=480&asset_token=SIFGewyrciPVMNHqk6Nw3TI45qyWdJGJ2NOTGxR9FRA&hash=9d772b37ac8c805e780945a422a353b980b28e45&p=complete"
                      transparent
                    />
                  }
                >
                  <TextButton onClick={clearAllFilters}>
                    Clear Search
                  </TextButton>
                </Table.EmptyState>
              )}
            </Card>
          </Page.Sticky>
          <Card>
            <Box style={{ overflow: "hidden", borderRadius: "0 0 8px 8px" }}>
              <Table.Content titleBarVisible={false} />
            </Box>
          </Card>
        </Table>
      </Cell>

      {sortedFAQData.length > itemsPerPage && (
        <Cell span={12}>
          <Box align="center" paddingTop="20px">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          </Box>
        </Cell>
      )}
    </Layout>
  );
};

export default FAQEditor;
