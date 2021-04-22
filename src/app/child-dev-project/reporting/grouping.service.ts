import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GroupingService {
  constructor() {}

  public groupBy<T, K extends keyof T>(
    data: T[],
    ...properties: K[]
  ): GroupingResultNode<T, K> {
    const propertyGrouping = new Grouping<T, K>(properties);
    data.forEach((el) => propertyGrouping.add(el));
    return propertyGrouping.createGroupingTree();
  }
}

export type GroupingResult<T, K extends keyof T> = {
  values: { [key in K]?: T[K] };
  data: T[];
};

export type GroupingResultNode<T, K extends keyof T> = {
  all: T[];
  subGroups?: {
    values: { [key in K]?: T[K] };
    group: GroupingResultNode<T, K>;
  }[];
};

export class Grouping<T, K extends keyof T> {
  private all: T[] = [];
  private allGroup: Grouping<T, K>;
  private groups: { value: T[K]; data: Grouping<T, K> }[] = [];
  private readonly currentProperty: K;
  private readonly nextProperties: K[];

  constructor(properties: K[]) {
    if (properties.length > 0) {
      this.currentProperty = properties[0];
      this.nextProperties = properties.slice(1);
      this.allGroup = new Grouping<T, K>(this.nextProperties);
    }
  }

  public add(element: T) {
    this.all.push(element);
    if (this.currentProperty) {
      this.allGroup.add(element);
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

  public createGroupingTree(): GroupingResultNode<T, K> {
    const groupingResult: GroupingResultNode<T, K> = {
      all: this.all,
    };
    const subgroup: {
      values: { [key in K]?: T[K] };
      group: GroupingResultNode<T, K>;
    }[] = [];
    if (this.allGroup) {
      subgroup.push(...this.allGroup.createGroupingTree().subGroups);
    }
    return null;
  }

  public flatten(): GroupingResult<T, K>[] {
    const flattened: GroupingResult<T, K>[] = [];
    if (this.currentProperty) {
      flattened.push(...this.allGroup.flatten());
      this.groups.forEach((group) => {
        const flattenedGroup = group.data.flatten();
        flattenedGroup.forEach(
          ({ values }) => (values[this.currentProperty] = group.value)
        );
        flattened.push(...flattenedGroup);
      });
    } else {
      // Only leaf nodes return data
      flattened.push({ values: {}, data: this.all });
    }
    return flattened;
  }
}
