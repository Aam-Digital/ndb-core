export interface ImportMetaData {
  entityType: string;
  transactionId?: string;
  columnMap: { [key in string]: string };
  dateFormat?: string;
}
