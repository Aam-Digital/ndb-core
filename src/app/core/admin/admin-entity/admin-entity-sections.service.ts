import { Injectable } from "@angular/core";
import { ColumnConfig } from "../../common-components/entity-form/FormConfig";

/**
 * A section in the admin screen of an entity type
 * that lists the records of a config entity type (e.g. Public Forms) belonging to that entity type.
 */
export interface AdminEntitySection {
  /** identifies the section, also used as the `mode` query parameter of the admin screen */
  id: string;

  /** shown as navigation item and as title of the section */
  label: string;

  /** explanation shown above the list */
  description?: string;

  /** further explanation shown below the list */
  footnote?: string;

  /** the config entity type whose records are listed, e.g. "PublicFormConfig" */
  entityType: string;

  /** the field of the config entity type that holds the name of the entity type it belongs to */
  property: string;

  /** the fields of the config records shown as columns of the list */
  columns: ColumnConfig[];
}

/**
 * Sections of the admin screen of an entity type.
 *
 * Use this from feature modules to list their own config records
 * (which are linked to an entity type) in the admin screen of that entity type.
 */
@Injectable({
  providedIn: "root",
})
export class AdminEntitySectionsService {
  private readonly _sections: AdminEntitySection[] = [];

  get sections(): AdminEntitySection[] {
    return this._sections;
  }

  addSections(sections: AdminEntitySection | AdminEntitySection[]): void {
    this._sections.push(...(Array.isArray(sections) ? sections : [sections]));
  }
}
