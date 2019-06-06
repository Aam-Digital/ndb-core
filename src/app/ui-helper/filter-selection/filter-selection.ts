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


export class FilterSelection<T> {

  public selectedOption = '';

  constructor (public name: string,
               public options: { key: string, label: string, filterFun: (c: T) => boolean}[] ) {

  }

  defaultFilterFunction = (c: T) => true;

  getOption(key: string) {
    return this.options.find((option) => option.key === key);
  }

  public getFilterFunction(key: string) {
    const option = this.getOption(key);

    if (!option) {
      return this.defaultFilterFunction;
    } else {
      return option.filterFun;
    }
  }

  public getSelectedFilterFunction() {
    return this.getFilterFunction(this.selectedOption);
  }

  public initOptions(keys: any[], attributeName: string) {
    const options = [{key: '', label: 'All', filterFun: (e: T) => true}];

    keys.forEach(k => {
      options.push({key: k.toLowerCase(), label: k.toString(), filterFun: (e: T) => e[attributeName] === k});
    });

    this.options = options;
  }
}
