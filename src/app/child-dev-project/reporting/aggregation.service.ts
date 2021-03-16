import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Entity } from "../../core/entity/entity";
import { Child } from "../children/model/child";

export interface PropertyQuery {
  [key: string]: any;
}

@Injectable({
  providedIn: "root",
})
export class AggregationService {
  private entities = new Map<typeof Entity, Entity[]>();
  private dataPromise: Promise<any>;
  constructor(private entityMapper: EntityMapperService) {}

  public loadData() {
    this.dataPromise = this.entityMapper
      .loadType<Child>(Child)
      .then((children) => this.entities.set(Child, children));
  }

  public async countEntitiesByProperties(
    entityClass: typeof Entity,
    propertyQueries: PropertyQuery[]
  ): Promise<number[]> {
    await this.dataPromise;
    const count = Array<number>(propertyQueries.length).fill(0);
    for (const entity of this.entities.get(entityClass)) {
      for (let i = 0; i < propertyQueries.length; i++) {
        if (
          Object.keys(propertyQueries[i]).every(
            (key) => entity[key] === propertyQueries[i][key]
          )
        ) {
          count[i]++;
        }
      }
    }
    return count;
  }
}
