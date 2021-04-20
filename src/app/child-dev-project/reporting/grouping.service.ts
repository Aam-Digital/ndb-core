import { Injectable } from "@angular/core";

export class Grouping<T, K extends keyof T> {
  all: T[] = [];
  groups: { value: T[K]; data: Grouping<T, K> }[] = [];
  readonly currentProperty: K;
  readonly nextProperties: K[];

  constructor(properties: K[]) {
    if (properties.length > 0) {
      this.currentProperty = properties[0];
      this.nextProperties = properties.slice(1);
    }
  }

  public add(element: T) {
    this.all.push(element);
    if (this.currentProperty) {
      const existing = this.groups.find(
        (group) => group.value === element[this.currentProperty]
      );
      if (existing) {
        existing.data.add(element);
      } else {
        const newGrouping = new Grouping<T, K>(this.nextProperties);
        this.groups.push({
          value: element[this.currentProperty],
          data: newGrouping,
        });
        newGrouping.add(element);
      }
    }
  }

  public flatten(): { values: { [key in K]?: T[K] }; data: T[] }[] {
    const flattened: { values: { [key in K]?: T[K] }; data: T[] }[] = [
      { values: {}, data: this.all },
    ];
    this.groups.forEach((group) => {
      const flattenedGroup = group.data.flatten();
      flattenedGroup.forEach(
        ({values}) => (values[this.currentProperty] = group.value)
      );
      flattened.push(...flattenedGroup);
    });
    console.log("flattened", flattened);
    return flattened;
  }
}

@Injectable({
  providedIn: "root",
})
export class GroupingService {
  constructor() {}

  public groupBy<T, K extends keyof T>(
    data: T[],
    ...properties: K[]
  ): Grouping<T, K> {
    const propertyGrouping = new Grouping<T, K>(properties);
    data.forEach((el) => propertyGrouping.add(el));
    return propertyGrouping;
  }
}
