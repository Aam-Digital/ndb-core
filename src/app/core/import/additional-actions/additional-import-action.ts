/**
 * Definition of an additional generic import action, e.g. linking imported records to an existing group entity.
 */
export interface AdditionalImportAction {
  type: string; // TODO: type is already encoded as prefix in id, so this could be removed
  id: string;
}
