import React, { type FC, useEffect, useState } from "react";
import {
  Page,
  WixDesignSystemProvider,
  Tabs,
  PopoverMenu,
  Button,
  Box,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { items } from "@wix/data";
import { TextItem, PackageItem, FAQItem, ImageItem } from "../../types";
import PackagesEditor from "../../components/PackagesEditor";
import TextContentEditor from "../../components/TextContentEditor";
import LegalEditor from "../../components/LegalEditor";
import FAQEditor from "../../components/FAQEditor";
import * as Icons from "@wix/wix-ui-icons-common";

const TabItems: { id: number; title: string }[] = [
  { id: 1, title: "Home" },
  { id: 2, title: "About me" },
  { id: 3, title: "Pricing" },
  { id: 4, title: "Legal" },
  { id: 5, title: "FAQ" },
];

const Index: FC = () => {
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [textData, setTextData] = useState<TextItem[]>([]);
  const [packagesData, setPackagesData] = useState<PackageItem[]>([]);
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [imageData, setImageData] = useState<ImageItem[]>([]);
  const [selectedLang, setSelectedLang] = useState("English");

  useEffect(() => {
    let isMounted = true;

    const getTabData = async () => {
      try {
        if (activeTabId === 1 || activeTabId === 2) {
          const [textResult, imageResult] = await Promise.all([
            fetchCollection<any, TextItem>("text", mapText),
            fetchCollection<any, ImageItem>("images", mapImage),
          ]);
          const pages = { 1: "Home", 2: "About me" };
          const pageData = textResult.filter(
            (item) => item.page === pages[activeTabId],
          );
          if (isMounted) {
            setTextData(pageData);
            setImageData(imageResult);
          }
        } else if (activeTabId === 4) {
          const data: TextItem[] = await fetchCollection<any, TextItem>(
            "text",
            mapText,
          );
          const pageData = data.filter((item) => item.page === "Legal");
          if (isMounted) setTextData(pageData);
        } else if (activeTabId === 3) {
          const [packagesResult, textResult, imageResult] = await Promise.all([
            fetchCollection<any, PackageItem>("packages", mapPackages),
            fetchCollection<any, TextItem>("text", mapText),
            fetchCollection<any, ImageItem>("images", mapImage),
          ]);
          const pageData = textResult.filter((item) => item.page === "Pricing");
          if (isMounted) {
            setPackagesData(packagesResult);
            setTextData(pageData);
            setImageData(imageResult);
          }
        } else if (activeTabId === 5) {
          const data: FAQItem[] = await fetchCollection<any, FAQItem>(
            "faq",
            mapFAQ,
          );
          if (isMounted) setFaqData(data);
        }
      } catch (err) {
        console.error("Error fetching tab data:", err);
      }
    };
    getTabData();

    return () => {
      isMounted = false;
    };
  }, [activeTabId]);

  // QUERY FUNCTION FOR COLLECTIONS
  async function fetchCollection<RawItem, MappedItem>(
    collectionName: string,
    mapFn: (item: RawItem) => MappedItem,
  ): Promise<MappedItem[]> {
    const results = await items.query(collectionName).limit(1000).find();

    if (results.items.length > 0) {
      return results.items.map((item) => mapFn(item as RawItem));
    } else {
      console.warn(`No items found in ${collectionName}`, results);
      return [];
    }
  }

  // TEXT COLLECTION
  const mapText = (item: any): TextItem => {
    return {
      id: item._id,
      title: item.title,
      page: item.page,
      section: item.section,
      header: item.header,
      subtype: item.subtype,
      content: item.content,
      cardOrder: item.cardOrder,
      primaryButton: item.primaryButton,
      contentTextColour: item.ContentTextColour,
      imageRef: item.imageRef || null,
      imageAltText: item.imageAltText,
      language: item.language,
    };
  };

  // IMAGES COLLECTION
  const mapImage = (item: any): ImageItem => ({
    id: item._id,
    image: item.image,
  });

  // PACKAGES & PRICING COLLECTION
  const mapPackages = (item: any): PackageItem => ({
    id: item._id,
    type: item.packageType,
    name: item.title,
    totalPrice: item.totalPrice,
    sessionPrice: item.sessionPrice,
    sessionQty: item.sessionsQty,
    validity: item.validityMonths,
  });

  // FAQ COLLECTION
  const mapFAQ = (item: any): FAQItem => ({
    id: item._id,
    question: item.question,
    answer: item.answer,
    topic: item.topic,
    order: item.order,
    language: item.language,
    title: item.title,
  });

  // TAB REFRESH
  const refreshTabData = async () => {
    try {
      if (activeTabId === 1 || activeTabId === 2) {
        const [textResult, imageResult] = await Promise.all([
          fetchCollection<any, TextItem>("text", mapText),
          fetchCollection<any, ImageItem>("images", mapImage),
        ]);
        const pages = { 1: "Home", 2: "About me" };
        const pageData = textResult.filter(
          (item) => item.page === pages[activeTabId],
        );
        setTextData(pageData);
        setImageData(imageResult);
      } else if (activeTabId === 3) {
        const [packagesResult, textResult, imageResult] = await Promise.all([
          fetchCollection<any, PackageItem>("packages", mapPackages),
          fetchCollection<any, TextItem>("text", mapText),
          fetchCollection<any, ImageItem>("images", mapImage),
        ]);
        const pageData = textResult.filter((item) => item.page === "Pricing");
        setPackagesData(packagesResult);
        setTextData(pageData);
        setImageData(imageResult);
      } else if (activeTabId === 5) {
        const data: FAQItem[] = await fetchCollection<any, FAQItem>(
          "faq",
          mapFAQ,
        );
        setFaqData(data);
      }
    } catch (error) {
      console.error("Error refreshing data", error);
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Website Content Management"
          subtitle="Select a webpage to update content for below."
        />
        <Page.Tail>
          <Tabs
            items={TabItems}
            type="compactSide"
            activeId={activeTabId}
            onClick={(tab) => setActiveTabId(tab.id as number)}
            sideContent={
              <PopoverMenu
                triggerElement={
                  <Button 
                  skin="inverted" 
                  suffixIcon={<Icons.ChevronDown />}>
                    Language: {selectedLang}
                  </Button>
                }
              >
                <PopoverMenu.MenuItem
                  text="English"
                  suffixIcon={selectedLang === "English" ? <Icons.Confirm /> : undefined}
                  onClick={() => {setSelectedLang("English")}}
                />
                <PopoverMenu.MenuItem
                  text="German"
                  suffixIcon={selectedLang === "German" ? <Icons.Confirm /> : undefined}
                  onClick={() => {setSelectedLang("German")}}
                  
                />
              </PopoverMenu>
            }
          />
        </Page.Tail>
        <Page.Content>
          {(activeTabId === 1 || activeTabId === 2) && (
            <TextContentEditor key={activeTabId} textData={textData} imageData={imageData} selectedLang={selectedLang} onDataChange={refreshTabData} />
          )}

          {activeTabId === 3 && (
            <PackagesEditor
              packagesData={packagesData}
              textData={textData}
              imageData={imageData}
              selectedLang={selectedLang}
              onDataChange={refreshTabData}
            />
          )}

          {activeTabId === 4 && <LegalEditor textData={textData} />}

          {activeTabId === 5 && (
            <FAQEditor faqData={faqData} onDataChange={refreshTabData} selectedLang={selectedLang} />
          )}
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default Index;
