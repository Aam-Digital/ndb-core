/**
 * Config object for the EditExternalProfileLink fields.
 */
export interface ExternalProfileLinkConfig {
  /**
   * The entity fields to use as default search values for the external profile lookup.
   */
  searchFields: {
    fullName?: string[];
    email?: string[];
    phone?: string[];
  };
}
