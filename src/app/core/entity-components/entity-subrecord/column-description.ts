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

import { ColumnDescriptionInputType } from "./column-description-input-type.enum";
import { Entity } from "../../entity/entity";

/**
 *  A ColumnDescription describes a single column to be generated in the generic {@link EntitySubrecordComponent}.
 *  .
 */
export interface ColumnDescription {
  /**
   * The identifier of the column and key of the entities' property that is displayed in that column
   */
  name: string;

  /** The label for the column displayed in the table header */
  label: string;

  /** How the value of this column is displayed and what kind of form field is provided to edit it */
  inputType: ColumnDescriptionInputType;

  /** Array of possible values for editing this column; required for inputTypes select and autocomplete */
  selectValues?: Array<{ value: any; label: string }>;

  /**
   * visibleFrom The minimal screen size the column is shown.
   *           screen size classes: xs  'screen and (max-width: 599px)'
   *           sm  'screen and (min-width: 600px) and (max-width: 959px)'
   *           md  'screen and (min-width: 960px) and (max-width: 1279px)'
   *           lg  'screen and (min-width: 1280px) and (max-width: 1919px)'
   *           xl  'screen and (min-width: 1920px) and (max-width: 5000px)'
   */
  visibleFrom?: string;

  /** (Optional) function building a ngStyle value, receiving the value as a parameter */
  styleBuilder?: (value) => Object;

  /**
   * a function taking the full object (Entity instance) and returning the value that is displayed in this column.
   *
   * use this function to format a value or calculate a more complex value that is not directly a property of the entity object.
   */
  valueFunction?: (entity: Entity) => any;

  /**
   * In case `inputType === ColumnDescriptionInputType.CONFIGURABLE_ENUM` this required to be set to the id of the enum
   */
  enumId?: string;
}
