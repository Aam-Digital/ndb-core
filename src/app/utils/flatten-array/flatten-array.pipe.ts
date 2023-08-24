import { Pipe, PipeTransform } from "@angular/core";

/**
 * Flatten a deep array while also removing "undefined" items
 */
@Pipe({
  name: "flattenArray",
  standalone: true,
})
export class FlattenArrayPipe implements PipeTransform {
  transform(value): any[] {
    if (!Array.isArray(value)) {
      return value ? [value] : [];
    }

    return [].concat(...value.map((e) => this.transform(e)));
  }
}
