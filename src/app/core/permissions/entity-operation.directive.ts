import { Directive, ElementRef, Input, OnInit } from "@angular/core";
import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { Entity, EntityConstructor } from "../entity/entity";

@Directive({
  selector: "[appEntityOperation]",
})
export class EntityOperationDirective implements OnInit {
  @Input("appEntityOperation") arguments: {
    operation: OperationType;
    entity: EntityConstructor<Entity>;
  };
  constructor(
    private el: ElementRef,
    private entityPermissionService: EntityPermissionsService
  ) {}

  ngOnInit() {
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
