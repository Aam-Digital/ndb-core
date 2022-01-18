import { CsvValidationStatus } from "./csv-validation-Status.enum";

export interface CsvValidationResult {
  status: CsvValidationStatus;
  message: string;
}
