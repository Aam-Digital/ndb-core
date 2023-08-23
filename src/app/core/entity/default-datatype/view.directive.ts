import { Entity } from "../model/entity";
import { Directive, Input } from "@angular/core";

@Directive()
export abstract class ViewDirective<T, C = any> {
  @Input() entity: Entity;
  @Input() id: string;
  @Input() tooltip: string;
  @Input() value: T;
  @Input() config: C;
}
