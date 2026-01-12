import React, { type FC, useState, useEffect } from "react";
import { dashboard } from "@wix/dashboard";
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
  Table,
  TableActionCell,
  TableToolbar,
  Page,
  TagList,
  Heading,
  Text,
  Divider,
  IconButton,
  Tooltip,
  DropdownLayoutValueOption,
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
} from "../types";
import { SortDescending, Edit as EditIcon } from "@wix/wix-ui-icons-common";
import { items } from "@wix/data";

interface PackagesEditorProps {
  packagesData: PackageItem[];
  onDataChange: () => Promise<void>;
}

const PackagesEditor: FC<PackagesEditorProps> = ({
  packagesData,
  onDataChange,
}) => {
  const [sortedPackData, setSortedPackData] = useState<PackageItem[]>([
    ...packagesData,
  ]);
  const [descriptions, setDescriptions] = useState<PackageItem[]>([]);
  const descriptionIds = [
    "ea008f34-79d3-4615-8960-27119e38346c", // Quick 40
    "b813c0a4-6de6-477b-a909-2e6a5b62410b", // Standard 60
    "93aecbfa-6e40-4967-9560-73f881128170", // Extended 75
    "c992a468-02d0-458b-b8f4-e8dbc6207703", // Test
  ];

  useEffect(() => {
    setSortedPackData([...packagesData]);

    const filteredDescriptions = packagesData.filter((item) =>
      descriptionIds.includes(item.id)
    );
    // console.log(filteredDescriptions);
    const sortedDescriptions = filteredDescriptions.sort((a, b) => {
      return descriptionIds.indexOf(a.id) - descriptionIds.indexOf(b.id);
    });
    // console.log(sortedDescriptions);

    setDescriptions(sortedDescriptions);
  }, [packagesData]);

  // PACKAGE DESCRIPTIONS
  // EDIT FOR DISPLAYING RICHTEXT
  const reformatHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };
  // MODAL FUNCTION TO EDIT DESCRIPTIONS
  const handleEditDescription = async (descriptionId: string, type: string) => {
    const result = await dashboard.openModal({
      modalId: "bb733afb-b807-4811-9122-04428fb97dd9",
      params: { id: descriptionId, type: type },
    });

    const modalResult = (await result.modalClosed) as ModalResult;

    if (modalResult?.saved) {
      await onDataChange;
    }
  };

  // FILTER VARIABLES
  const typeOptions: TypeOption[] = [
    { id: 0, value: "All Types", type: "type" },
    { id: 1, value: "Quick 40", type: "type" },
    { id: 2, value: "Standard 60", type: "type" },
    { id: 3, value: "Extended 75", type: "type" },
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

  const [subtoolbarVisible, setSubtoolbarVisible] = useState(false);
  const [filters, setFilters] = useState<FilterTag[]>([]);

  const compileFilters = (
    typeSelection: TypeOption,
    sessionSelection: SessionOption
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
              // console.log(option);
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
              // console.log(option);
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
    sameOptionWasPicked: boolean
  ) => {
    const selected = typeOptions.find((o) => o.id === option.id);
    if (selected) handleFilterSelection(selected);
  };

  const handleSessionSelect = (
    option: DropdownLayoutValueOption,
    sameOptionWasPicked: boolean
  ) => {
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
  const handleSortClick = (columns: any) => {
    let key: keyof PackageItem;

    switch (columns.id) {
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
    const result = await dashboard.openModal({
      modalId: "8165bb05-e4cc-48cd-bc95-2b36f72a96ef",
      params: { id: row.id },
    });

    const modalResult = (await result.modalClosed) as ModalResult;

    if (modalResult?.saved) {
      await onDataChange();
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
      <Cell span={12}>
        <Card>
          <Card.Header title="Descriptions" />
          <Card.Divider />
          <Card.Content>
            <Layout>
              {descriptions.map((desc, index) => (
                <Cell key={desc?.id || index} span={4}>
                  <Box direction="horizontal" gap="SP" verticalAlign="top">
                    <Box direction="vertical" gap="SP1" flexGrow={1}>
                      <Heading size="small">{desc?.type}</Heading>
                      <Text size="small">
                        {reformatHtmlTags(desc?.description || "")}
                      </Text>
                    </Box>
                    <Tooltip content="Edit description">
                      <IconButton
                        priority="secondary"
                        onClick={() =>
                          handleEditDescription(desc?.id, desc?.type)
                        }
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Cell>
              ))}
            </Layout>
          </Card.Content>
        </Card>
      </Cell>
      <Cell span={12}>
        <Card>
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
        </Card>
      </Cell>
    </Layout>
  );
};

export default PackagesEditor;
