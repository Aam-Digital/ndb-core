import { CsvValidationStatus } from "./csv-validation-status.enum";

export interface CsvValidationResult {
  status: CsvValidationStatus;
  message: string;
}
