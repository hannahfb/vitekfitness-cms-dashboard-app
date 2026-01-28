import { DropdownLayoutValueOption } from "@wix/design-system";

export interface TextItem {
  id: string;
  title: string;
  header: string;
  section: string;
  page: string;
  subtype: string;
  cardOrder: number;
  content: string;
  primaryButton: string;
  contentTextColour: string;
  image: string | null;
  imageAltText: string;
}

export interface PackageItem {
  id: string;
  type: string;
  name: string;
  totalPrice: number;
  sessionPrice: number;
  sessionQty: number;
  validity: number;
  description: string;
  isDescription?: boolean;
}

export interface PackageRecord {
  _id: string;
  packageType: string;
  title: string;
  totalPrice: number;
  sessionPrice: number;
  sessionsQty: number;
  validityMonths: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  topic: string;
  order: number;
}

export interface SortKey {
  key: "type" | "sessionQty" | "sessionPrice" | "totalPrice" | "validity";
}

export interface TypeOption extends DropdownLayoutValueOption {
  type: "type" | "content";
}

export interface SessionOption extends DropdownLayoutValueOption {
  qty: number;
  type: "session";
}

export type FilterOption = TypeOption | SessionOption;

export type SectionOption = {
  id: number;
  value: string;
  count: number;
};

export interface FilterTag {
  id: string;
  children: string | number;
}

export interface ModalResult {
  saved?: boolean;
  deleted?: boolean;
}

export interface ImageModalResponse {
  action?: "openMediaManager";
  saved?: boolean;
  newImageUrl?: string;
  altText?: string;
}

export interface SaveModalResponse {
  saved?: boolean;
}
