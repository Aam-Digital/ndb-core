/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { FormValidatorConfig } from "../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { EntityReferenceRole } from "../../basic-datatypes/entity/entity-reference-role";
import { DefaultValueConfig } from "./default-value-config";

/**
 * Interface for additional configuration about a DatabaseField schema.
 *
 * This is used as parameter for the DatabaseField annotation:
 *
 * `@DatabaseField(fieldConfig: EntitySchemaField)`
 */
export interface EntitySchemaField {
  /**
   * The datatype of this field. This will trigger to matching datatype transformer when saving/loading the entity.
   *
   * If you don't set this explicitly, the dataType is inferred from the TypeScript type of the property that is annotated.
   */
  dataType?: string;

  /**
   * If the dataType can hold multiple values, as an array of the given dataType.
   */
  isArray?: boolean;

  /**
   * Set to true to make the framework automatically create an index to retrieve/filter Entities quickly based on this field
   *
   * @todo not implemented yet
   */
  generateIndex?: boolean;

  /**
   * If set to `true`, the entity can be found in the global search by entering this value
   */
  searchable?: boolean;

  /**
   * Configure the default value mode of this field.
   * Default values are applied to form fields, if field is empty
   * The form will be disabled, until all default value configs are applied
   *
   */
  defaultValue?: DefaultValueConfig;

  /**
   * (Optional) Assign any custom "extension" configuration you need for a specific datatype extension.
   *
   * You can pass any kind of value here to allow complex custom datatype transformations
   * that are not part of the core datatypes and therefore not included in this core interface.
   */
  additional?: any;

  /**
   * (Optional) If the dataType of this field references another entity,
   *    define the role of this relationship for the entity containing this field.
   *
   * i.e. how "important" is the entity this field is referencing?
   * Does this the entity containing this field (not the referenced entity) still have meaning after the referenced entity has been deleted?
   *
   * see options of the `EntityReferenceRole` type
   */
  entityReferenceRole?: EntityReferenceRole;

  // TODO: possibly remove viewComponent + editComponent from schema and only infer via dataType (or overwrite in FormFieldConfig)

  /**
   * (Optional) Define using which component this property should be displayed in lists and forms.
   *
   * The edit component has to be a registered component. Components that are registered contain the `DynamicComponent`
   * decorator
   * If nothing is defined, the default component for this datatype will be used.
   */
  viewComponent?: string;

  /**
   * (Optional) Define using which component this property should be editable in lists and forms.
   *
   * The edit component has to be a registered component. Components that are registered contain the `DynamicComponent`
   * decorator
   * If nothing is defined, the default component for this datatype will be used.
   */
  editComponent?: string;

  /**
   * A label which explains this value in a human-readable way
   */
  label?: string;

  /**
   * A short label which can be used in tables.
   * If nothing is specified, the long name will be used.
   */
  labelShort?: string;

  /**
   * A further description of the property which can be displayed in tooltips.
   */
  description?: string;

  validators?: FormValidatorConfig;

  /** whether to show this field in the default details view */
  showInDetailsView?: boolean;

  /**
   * whether the field will be retained when the entity is "anonymized".
   *
   * By default, fields are removed (data minimization by default).
   *
   * "retain-anonymized" triggers a special dataType action to retain the data partially in a special, anonymized form.
   */
  anonymize?: "retain" | "retain-anonymized";
}

/**
 * Available placeholder variables that can be used to configure a dynamic default value.
 * (e.g. "$now" to set to current date)
 */
export enum PLACEHOLDERS {
  NOW = "$now",
  CURRENT_USER = "$current_user",
}
