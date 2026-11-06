import { inject, Injectable } from "@angular/core";
import { Logging } from "../../../logging/logging.service";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EmbeddedEntity } from "../../../entity/model/embedded-entity";
import { uniquePropertyValidator } from "../unique-property-validator/unique-property-validator";
import { FieldValidator, ValidatorContext } from "./field-validator";
import { AsyncPromiseValidatorFn } from "./validator-types";

/** `uniqueId: true`: no other record of the same type may have the same value in this field */
@Injectable()
export class UniqueIdValidator extends FieldValidator<boolean> {
  static override readonly key = "uniqueId";
  override readonly async = true;
  override readonly requiresFieldId = true;

  private readonly entityMapper = inject(EntityMapperService);

  build(
    _value: boolean,
    { entity, field }: ValidatorContext,
  ): AsyncPromiseValidatorFn | null {
    const fieldId = field.id;
    if (entity instanceof EmbeddedEntity) {
      // not supported (yet) for inner fields of embedded entries: unique among which entries is not decided
      Logging.debug("Skipping uniqueId validator of an embedded entry", {
        fieldId,
      });
      return null;
    }

    return uniquePropertyValidator({
      getExistingValues: () =>
        this.entityMapper
          .loadType(entity.getType())
          .then((entities) =>
            entities
              .map((existingEntity) => Reflect.get(existingEntity, fieldId))
              .filter((existingValue) => existingValue !== undefined),
          ),
      normalize: false,
      fieldLabel: $localize`:field label:id`,
      errorKey: UniqueIdValidator.key,
    });
  }
}
