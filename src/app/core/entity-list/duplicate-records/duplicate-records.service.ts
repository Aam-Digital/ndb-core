import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";
import { AlertService } from "app/core/alerts/alert.service";
import { getUrlWithoutParams } from "app/utils/utils";
import { Router } from "@angular/router";
import { BulkOperationStateService } from "../../entity/entity-actions/bulk-operation-state.service";

@Injectable({
  providedIn: "root",
})
export class DuplicateRecordService {
  private readonly entityMapperService = inject(EntityMapperService);
  private readonly entityService = inject(EntitySchemaService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly bulkOperationState = inject(BulkOperationStateService);

  async duplicateRecord(
    sourceData: Entity | Entity[],
    navigate: boolean = false,
  ): Promise<boolean> {
    const entities = Array.isArray(sourceData) ? sourceData : [sourceData];
    const duplicateData = this.clone(entities);

    this.bulkOperationState.startBulkOperation(
      duplicateData.length,
      duplicateData.map((entity) => entity.getId()),
    );

    try {
      await this.entityMapperService.saveAll(duplicateData);
    } catch (error) {
      this.bulkOperationState.completeBulkOperation();
      throw error;
    }

    await this.bulkOperationState.waitForBulkOperationToFinish();
    this.alertService.addInfo(this.generateSuccessMessage(entities));

    if (navigate) {
      const currentUrl = getUrlWithoutParams(this.router);
      const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
      this.router.navigate([parentUrl, duplicateData[0].getId(true)]);
    }

    return true;
  }

  clone(sourceData: Entity[]): any {
    const duplicateData = [];

    sourceData.map((item: Entity) => {
      const entityConstructor = item.getConstructor();
      const keys = [...entityConstructor.schema.keys()].filter(
        (key) => key !== "_id" && key !== "_rev",
      );
      const dbEntity = this.entityService.transformEntityToDatabaseFormat(item);
      const entityformat = this.entityService.transformDatabaseToEntityFormat(
        dbEntity,
        entityConstructor.schema,
      );
      const entity = new entityConstructor();
      const nameAttribute = entityConstructor.toStringAttributes[0];
      for (const key of keys) {
        if (nameAttribute === key && nameAttribute !== "entityId") {
          entityformat[key] = `Copy of ${entityformat[key]}`;
        }
        entity[key] = entityformat[key];
      }
      duplicateData.push(entity);
    });
    return duplicateData;
  }

  generateSuccessMessage(sourceData: Entity[]): string {
    if (sourceData.length > 1) {
      return $localize`:Entity action confirmation message:${sourceData.length} ${
        sourceData[0].getConstructor().labelPlural
      } duplicated successfully`;
    } else {
      return $localize`:Entity action confirmation message:${
        sourceData[0].getConstructor().label
      } "${sourceData.toString()}" duplicated successfully`;
    }
  }
}
