/**
 * Basic data structure representing a profile from an external system
 * that can be linked and used to import additional information.
 */
export interface ExternalProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  skills: any; // Array of objects (Skill)
  updatedAtExternalSystem: string;
  importedAt: string;
  latestSyncAt: string;
}
