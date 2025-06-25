import { Component, OnInit, inject } from "@angular/core";
import { EntityTypeLabelPipe } from "app/core/common-components/entity-type-label/entity-type-label.pipe";
import { ViewDirective } from "../default-datatype/view.directive";
import { asArray } from "app/utils/asArray";

@Component({
  selector: "app-display-entity-type",
  standalone: true,
  providers: [EntityTypeLabelPipe],
  template: `<span class="display-entity-type-label">{{ entityLabel }}</span>`,
  styleUrls: ["./display-entity-type.component.scss"],
})
export class DisplayEntityTypeComponent
  extends ViewDirective<string[] | string, string>
  implements OnInit
{
  private entityTypeLabelPipe = inject(EntityTypeLabelPipe);

  entityLabel: string;

  async ngOnInit() {
    const entityIds = this.value ? asArray(this.value) : [];
    this.entityLabel = entityIds
      .map((id) => this.entityTypeLabelPipe.transform(id) || id)
      .join(", ");
  }
}
