import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
} from "@angular/core";
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
    private entityPermissionService: EntityPermissionsService,
    private renderer: Renderer2
  ) {}

  ngOnChanges() {
    if (this.arguments?.operation && this.arguments?.entity) {
      const permitted = this.entityPermissionService.userIsPermitted(
        this.arguments.entity,
        this.arguments.operation
      );
      setTimeout(() => {
        // The timeout is required because the mat-button directive otherwise sets disabled back to false in the
        // Form component. Other components somehow do not have this problem.
        if (!permitted) {
          this.renderer.setAttribute(this.el.nativeElement, "disabled", "true");
        }
      });
    }
  }
}
