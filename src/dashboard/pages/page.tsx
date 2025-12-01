import React, { type FC, useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import {
  Button,
  EmptyState,
  Image,
  Page,
  TextButton,
  WixDesignSystemProvider,
  Card,
  Layout,
  Cell,
  Tabs,
  FormField,
  Dropdown,
  Input,
  RichTextInputArea,
  Box,
  AutoComplete,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import * as Icons from "@wix/wix-ui-icons-common";
import { items } from "@wix/data";
import { TextItem, PackageItem } from "../../types";

const Index: FC = () => {
  const TabItems = [
    { id: 1, title: "Home" },
    { id: 2, title: "About me" },
    { id: 3, title: "Pricing" },
  ];

  const [activeTabId, setActiveTabId] = useState(1);
  const [textData, setTextData] = useState<TextItem[]>([]);
  const [packagesData, setPackagesData] = useState<PackageItem[]>([]);

  const [sectionOptions, setSectionOptions] = useState([]);
  const [subsectionOptions, setSubsectionOptions] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubsection, setSelectedSubsection] = useState<{
    id: String;
    value: string;
  } | null>(null);

  const [content, setContent] = useState({
    id: "",
    title: "",
    type: "",
    subtype: "",
    content: "",
  });
  const [contentHeader, setContentHeader] = useState("Content");
  const [contentTitle, setContentTitle] = useState("");

  useEffect(() => {
    const getTabData = async () => {
      switch (activeTabId) {
        case 1:
        case 2: {
          const data = await fetchCollection("text", mapText);
          const pages = { 1: "Home", 2: "About me" };
          const pageData = data.filter(
            (item) => item.page === pages[activeTabId]
          );
          setTextData(pageData);

          const sections = getSectionsOptions(pageData, "section");
          setSectionOptions(sections);

          if (sections.length) {
            const firstSection = sections[0].value;
            handleSelectSection({ value: firstSection });
          }
          break;
        }
        case 3: {
          const data = await fetchCollection("packages", mapPackages);
          setPackagesData(data);
          break;
        }
        default:
          break;
      }
    };

    getTabData();
  }, [activeTabId]);

  // QUERY FUNCTION FOR COLLECTIONS
  async function fetchCollection(collectionName, mapFn) {
    const results = await items.query(collectionName).find();

    if (results.items.length > 0) {
      return results.items.map(mapFn);
    } else {
      console.warn(`No items found in ${collectionName}`, results);
      return [];
    }
  }

  // Text Collection
  const mapText = (item: any): TextItem => ({
    id: item._id,
    title: item.title,
    section: item.section,
    page: item.page,
    type: item.type,
    subtype: item.subtype,
    content: item.content,
  });

  // Packages & Pricing Collection
  const mapPackages = (item: any): PackageItem => ({
    id: item._id,
    type: item.packageType,
    name: item.title,
    totalPrice: item.totalPrice,
    sessionPrice: item.sessionPrice,
  });

  // Section & Subsection options
  function getSectionsOptions(data, key) {
    const uniqueSections = Array.from(new Set(data.map((item) => item[key])));
    return uniqueSections.map((value, index) => ({
      id: index + 1,
      value,
    }));
  }
  // function getSubsectionOptions(data, section) {
  //   const filteredData = data.filter((item) => item.section === section);
  //   return filteredData.map((item) => ({
  //     id: item._id,
  //     value: item.title,
  //   }));
  // }

  // Changes & Events
  const handleSelectSection = (option) => {
    setSelectedSection(option.value);
    setSelectedSubsection(null);

    const filteredSubsections = textData.filter(
      (item) => item.section === option.value
    );
    const options = filteredSubsections.map((item) => ({
      id: item.id,
      value: item.title,
    }));

    setSubsectionOptions(options);
  };

  const handleSelectSubsection = (option) => {
    setSelectedSubsection(option);

    const selectedItem = textData.find((item) => item.id === option.id);
    setContent({
      id: selectedItem.id,
      title: selectedItem.title,
      type: selectedItem.type,
      subtype: selectedItem.subtype,
      content: selectedItem.content,
    });
  };

  const handleClearSubsection = () => {
    setSelectedSubsection(null);
    clearContent();
  };

  function clearContent() {
    setContentHeader("Content");
    setContentTitle("");
  }

  // async function insertItem() {
  //   const toInsert = {
  //     title: "New",
  //     packageType: "Ultimate 75",
  //     totalPrice: 10,
  //     sessionPrice: 5,
  //   };
  //   const inserted = await items.insert("packages", toInsert);
  //   console.log(inserted);
  // }

  // async function updateItem() {
  //   const toUpdate = {
  //     _id: "1e8f246c-ace0-4fda-9046-9177484d65a7",
  //     title: "Updated",
  //   };

  //   const updatedItem = await items.update("packages", toUpdate);
  //   console.log(updatedItem);
  // }

  // async function patch() {
  //   const updatedItem = await items
  //     .patch("packages", "f10a9912-842a-4280-8604-e9db1e4a21e7")
  //     .setField("title", "Updated")
  //     .run();
  // }

  // async function removeItem() {
  //   const result = await items.remove("packages", "f10a9912-842a-4280-8604-e9db1e4a21e7");
  //   console.log(result); // See removed item below
  // }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Website Content Management"
          subtitle="Select a webpage to update content for below."
          actionsBar={
            <Button
              onClick={() => {
                dashboard.showToast({
                  message: "Your first toast message!",
                });
              }}
              prefixIcon={<Icons.GetStarted />}
            >
              Show a toast
            </Button>
          }
        />
        <Page.Tail>
          <Tabs
            items={TabItems}
            type="compactSide"
            activeId={activeTabId}
            onClick={(tab) => setActiveTabId(tab.id)}
          />
        </Page.Tail>
        <Page.Content>
          <Layout>
            <Cell span={12}>
              <Card>
                <Card.Header title="Page Section"></Card.Header>
                <Card.Divider />
                <Card.Content>
                  <Layout gap="24px">
                    <Cell span={4}>
                      <FormField label="Section">
                        <Dropdown
                          placeholder="Select"
                          options={sectionOptions}
                          value={selectedSection}
                          onSelect={handleSelectSection}
                        />
                      </FormField>
                    </Cell>
                    <Cell span={4}>
                      <FormField label="Subsection">
                        <AutoComplete
                          placeholder="Select"
                          clearButton
                          options={subsectionOptions}
                          value={selectedSubsection?.value || ""}
                          onSelect={handleSelectSubsection}
                          onClear={handleClearSubsection}
                        />
                      </FormField>
                    </Cell>
                  </Layout>
                </Card.Content>
                <Card.Divider />
              </Card>
            </Cell>
            <Cell span={12}>
              <Card>
                <Card.Header title={contentHeader}></Card.Header>
                <Card.Divider />
                <Card.Content>
                  <Layout>
                    <Cell span={4}>
                      <FormField label="Name">
                        <Input value={content.title} />
                      </FormField>
                    </Cell>
                    <Cell span={4}>
                      <FormField label="Type">
                        <Input readOnly value={content.type} />
                      </FormField>
                    </Cell>
                    <Cell span={4}>
                      <FormField label="Subtype">
                        <Input readOnly value={content.subtype} />
                      </FormField>
                    </Cell>
                    <Cell>
                      <FormField label="Content">
                        <RichTextInputArea
                          key={content.id}
                          minHeight="120px"
                          initialValue={content.content}
                        />
                      </FormField>
                    </Cell>
                    <Box gap="20px">
                      <Button>Save</Button>
                      <Button priority="secondary">Cancel</Button>
                    </Box>
                  </Layout>
                </Card.Content>
                <Card.Divider />
              </Card>
            </Cell>
          </Layout>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default Index;
