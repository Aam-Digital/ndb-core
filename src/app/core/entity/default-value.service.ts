import { Injectable } from "@angular/core";
import { Entity } from "./model/entity";
import { HandleDefaultValuesUseCase } from "./default-field-value/handle-default-values.usecase";
import { EntitySchema } from "./schema/entity-schema";
import { DefaultValueConfig } from "./schema/default-value-config";
import { EntityForm } from "../common-components/entity-form/entity-form.service";

@Injectable({
  providedIn: "root",
})
export class DefaultValueService {
  constructor(private handleDefaultValuesUseCase: HandleDefaultValuesUseCase) {}

  async handleEntityForm<T extends Entity>(
    entityForm: EntityForm<T>,
    entity: Entity,
  ): Promise<void> {
    if (entityForm.defaultValueConfigs.size > 0) {
      await this.handleDefaultValuesUseCase.handleEntityForm(
        entityForm,
        entity.getSchema(),
        entity.isNew,
      );
    }
  }

  getDefaultValueConfigs<T extends Entity>(
    entity: T,
  ): Map<string, DefaultValueConfig> {
    let schema: EntitySchema = entity.getSchema();

    const defaultValueConfigs: Map<string, DefaultValueConfig> = new Map();

    for (const [key, entitySchemaField] of schema) {
      if (entitySchemaField.defaultValue) {
        defaultValueConfigs.set(key, entitySchemaField.defaultValue);
      }
    }

    return defaultValueConfigs;
  }
}
