import { Directive, ElementRef, Input, OnChanges } from "@angular/core";
import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { Entity } from "../entity/entity";

@Directive({
  selector: "[appEntityOperation]",
})
export class EntityOperationDirective implements OnChanges {
  @Input("appEntityOperation") arguments: {
    operation: OperationType;
    entity: typeof Entity;
  };
  constructor(
    private el: ElementRef,
    private entityPermissionService: EntityPermissionsService
  ) {}

  ngOnChanges() {
    if (this.arguments?.operation && this.arguments?.entity) {
      this.el.nativeElement.disabled =
        this.el.nativeElement.disabled ||
        !this.entityPermissionService.userIsPermitted(
          this.arguments.entity,
          this.arguments.operation
        );
    }
  }
}
