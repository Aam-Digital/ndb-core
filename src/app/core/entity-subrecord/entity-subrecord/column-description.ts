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

/**
 *  Objects of this class are used to define columns for the {@link EntitySubrecordComponent}.
 *  A ColumnDescription describes a single column to be generated in that generic component.
 */
export class ColumnDescription {
  /**
   * @param name The identifier of the column
   * @param label The label for the column displayed in the table header
   * @param inputType How the value of this column is displayed and what kind of form field is provided to edit it
   * @param selectValues Array of possible values for editing this column; required for inputTypes select and autocomplete
   * @param formatter Function doing a custom transformation of the column's value before it is displayed.
   * @param visibleFrom The minimal screen size the column is shown.
   *           screen size classes: xs	'screen and (max-width: 599px)'
   *           sm	'screen and (min-width: 600px) and (max-width: 959px)'
   *           md	'screen and (min-width: 960px) and (max-width: 1279px)'
   *           lg	'screen and (min-width: 1280px) and (max-width: 1919px)'
   *           xl	'screen and (min-width: 1920px) and (max-width: 5000px)'
   * @param styleBuilder (Optional) function building a ngStyle value, receiving the value as a parameter
   */
  constructor(
    public name: string,
    public label: string,
    public inputType: ColumnDescriptionInputType,

    public selectValues: Array<{ value: any; label: string }> = [],

    public formatter = (value) => {
      return value;
    },
    public visibleFrom: string = undefined,
    public styleBuilder: (value) => Object = () => {
      return {};
    }
  ) {}
}
