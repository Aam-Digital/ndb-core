import { Pipe, PipeTransform } from "@angular/core";

/**
 * Angular Pipe to transform a given object to an array of the object's keys.
 *
 * @example in a template to display keys of an enum:
 * `*ngFor="let g of enumGenders | keys"`
 */
@Pipe({
  name: "keys",
})
export class KeysPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    const keys = [];
    for (const key of Object.keys(value)) {
      keys.push({ key: key, value: value[key] });
    }
    return keys;
  }
}
