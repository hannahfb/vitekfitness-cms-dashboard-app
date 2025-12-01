export interface TextItem {
  id: string;
  title: string;
  section: string;
  page: string;
  type: string;
  subtype: string;
  content: string;
}

export interface PackageItem {
  id: string;
  type: string;
  name: string;
  totalPrice: number;
  sessionPrice: number;
}
