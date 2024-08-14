import { DemoChildGenerator } from "../demo-child-generator.service";
import { DemoDataGenerator } from "../../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../../model/child";
import { faker } from "../../../../core/demo-data/faker";
import { materials } from "./materials";
import { Entity } from "../../../../core/entity/model/entity";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";

export class DemoEducationMaterialConfig {
  minCount: number;
  maxCount: number;
}

/**
 * Generate EducationalMaterial records.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoEducationalMaterialGeneratorService extends DemoDataGenerator<Entity> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoEducationalMaterialGeneratorService.provider()]`
   */
  static provider(config: DemoEducationMaterialConfig) {
    return [
      {
        provide: DemoEducationalMaterialGeneratorService,
        useClass: DemoEducationalMaterialGeneratorService,
      },
      { provide: DemoEducationMaterialConfig, useValue: config },
    ];
  }

  constructor(
    private config: DemoEducationMaterialConfig,
    private demoChildren: DemoChildGenerator,
  ) {
    super();
  }

  public generateEntities(): Entity[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      const count = faker.number.int({
        min: this.config.minCount,
        max: this.config.maxCount,
      });
      for (let i = 1; i < count; i++) {
        data.push(this.generateEducationalMaterialEntity(child));
      }

      const specialMaterial = this.generateEducationalMaterialEntity(child);
      specialMaterial.materialType = faker.helpers.arrayElement(
        materials.filter((material) => material.hasOwnProperty("color")),
      ).id;
      specialMaterial.materialAmount = 1;
      data.push(specialMaterial);
    }

    return data;
  }

  private generateEducationalMaterialEntity(
    child: Child,
  ): Entity & { [key: string]: any } {
    const entity = createEntityOfType("EducationalMaterial");

    entity.child = child.getId();
    entity.date = faker.date.between({
      from: child.admissionDate,
      to: faker.getEarlierDateOrToday(child.dropoutDate),
    });
    entity.materialAmount = faker.helpers.arrayElement([1, 1, 1, 2, 3]);
    entity.materialType = faker.helpers.arrayElement(materials).id;

    return entity;
  }
}
