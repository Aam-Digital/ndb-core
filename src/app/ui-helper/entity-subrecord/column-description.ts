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

/*********** ColumnDescription *********
 Objects of this class are used to define columns for the entity-subrecord component.
 With it you can dynamically create a table (see child details page attendance as example)

 @param name, defines name of ColumnDescriptor
 @param label defines the label for the column, basically the headline
 @param inputType: type of  data shown in a cell.
          supported types: text, number, date, month, textarea, select, autocomplete
 @param selectedValues Array of possible values for this cell, needed for inputTypes select and autocomplete
 @param formatter function that formats the input value
 @param visibleFrom defines the minimal screen size the column is shown.
          screen size classes: xs	'screen and (max-width: 599px)'
                               sm	'screen and (min-width: 600px) and (max-width: 959px)'
                               md	'screen and (min-width: 960px) and (max-width: 1279px)'
                               lg	'screen and (min-width: 1280px) and (max-width: 1919px)'
                               xl	'screen and (min-width: 1920px) and (max-width: 5000px)'
 */

export class ColumnDescription {
  constructor(
    public name: string,
    public label: string,
    public inputType: string,

    public selectValues: Array<{value: any, label: string}> = [],

    public formatter = (value) => { return value; },
    public visibleFrom?: string,
  ) {}

}
