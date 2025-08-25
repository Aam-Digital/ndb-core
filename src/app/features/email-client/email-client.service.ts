import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { inject, Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class EmailClientService {
  private entityRegistry = inject(EntityRegistry);

  /**
   * Build a mailto link from an entity's email fields and open the local mail client.
   * 
   * If no default email client is available on the device / configured in the browser, then nothing will happen here.
   */
  executeMailtoFromEntity(entity: Entity): boolean {
    const entityType = this.entityRegistry.get(
      entity.getType(),
    ) as EntityConstructor<Entity>;

    let recipient: string | null = null;

    for (const [id, field] of entityType.schema.entries()) {
      if (field.dataType === EmailDatatype.dataType) {
        const emailValue = entity[field.id];
        recipient = emailValue;
        break; // Use only the first found email field
      }
    }

    if (!recipient) {
      return false;
    }

    const mailto = "mailto:" + encodeURIComponent(recipient);
    window.location.href = mailto;
    return true;
  }
}
