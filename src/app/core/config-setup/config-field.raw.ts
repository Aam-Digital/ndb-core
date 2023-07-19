/**
 * Structure of a row for config setup from imported CSV file.
 * Represents details of one entity property and is parsed into the app's Config format.
 */
export interface ConfigFieldRaw {
  id?: string;
  label: string;
  dataType: string;
  additional_type_details?: string;
  description?: string;
  show_in_list?: string;
  show_in_details?: string;
  remarks?: string;
}
