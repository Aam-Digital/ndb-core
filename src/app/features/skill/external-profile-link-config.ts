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

  /**
   * Mapping of data fields "from" the external profile "to" an entity field
   * what data should be imported and set on the entity.
   */
  applyData: {
    from: string;
    to: string;

    /** an (option) key for a map function to be executed on each source value*/
    transformation?: "escoSkill";
  }[];
}
