import { DemoChildGenerator } from "../demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../model/child";
import faker from "faker/locale/en_IND";
import { EducationalMaterial } from "./model/educational-material";
import { materials } from "./model/materials";
import { getEarlierDateOrToday } from "../../../utils/utils";

export class DemoEducationMaterialConfig {
  minCount: number;
  maxCount: number;
}

/**
 * Generate EducationalMaterial records.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoEducationalMaterialGeneratorService extends DemoDataGenerator<EducationalMaterial> {
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
    private demoChildren: DemoChildGenerator
  ) {
    super();
  }

  public generateEntities(): EducationalMaterial[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      const count = faker.datatype.number({
        min: this.config.minCount,
        max: this.config.maxCount,
      });
      for (let i = 1; i < count; i++) {
        data.push(this.generateEducationalMaterialEntity(child));
      }

      const specialMaterial = this.generateEducationalMaterialEntity(child);
      specialMaterial.materialType = faker.random.arrayElement(
        materials.filter((material) => material.hasOwnProperty("color"))
      );
      specialMaterial.materialAmount = 1;
      data.push(specialMaterial);
    }

    return data;
  }

  private generateEducationalMaterialEntity(child: Child): EducationalMaterial {
    const entity = new EducationalMaterial();

    entity.child = child.getId();
    entity.date = faker.date.between(
      child.admissionDate,
      getEarlierDateOrToday(child.dropoutDate)
    );
    entity.materialAmount = faker.random.arrayElement([1, 1, 1, 2, 3]);
    entity.materialType = faker.random.arrayElement(materials);

    return entity;
  }
}
