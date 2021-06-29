import { Pipe, PipeTransform } from "@angular/core";
import { Entity } from "../../../../entity/entity";

@Pipe({
  name: "entityFunction",
})
/**
 * A simple pipe which passes the input entity to the input function.
 * This reduces the change detection cycles, because the function is only re-calculated once the entity changed.
 */
export class EntityFunctionPipe implements PipeTransform {
  transform(value: Entity, func?: (entity: Entity) => any): any {
    return func(value);
  }
}
