/**
 * Basic data structure representing a profile from an external system
 * that can be linked and used to import additional information.
 */
export interface ExternalProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  skills: ExternalSkill[];
  updatedAtExternalSystem: string;
  importedAt: string;
  latestSyncAt: string;
}

/**
 * Skill data in a profile from an external system.
 */
export interface ExternalSkill {
  /**
   * The URI representing a specific skill in the ESCO classification.
   * see https://esco.ec.europa.eu/en/classification/skill_main
   */
  escoUri: string;

  /**
   * the frequency of using this skill
   */
  usage: "ALMOST_NEVER" | "SOMETIMES" | "OFTEN" | "ALMOST_ALWAYS" | "ALWAYS";
}
