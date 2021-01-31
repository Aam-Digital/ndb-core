import { Component } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ColumnCellConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { OnInitDynamicComponent } from "app/core/view/dynamic-components/on-init-dynamic-component.interface";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";

@UntilDestroy()
@Component({
  selector: "app-bmi-block",
  template: `{{ child[fieldId] }}`,
})
export class BmiBlockComponent implements OnInitDynamicComponent {
  public child: Child;
  public fieldId: string;

  constructor(private childrenService: ChildrenService) {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.child = config.entity as Child;
    this.fieldId = config.id;
    this.childrenService
      .getHealthChecksOfChild(config.entity.getId())
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        if (results.length > 0) {
          this.child[this.fieldId] = results
            .reduce((prev, cur) => (cur.date > prev.date ? cur : prev))
            .bmi.toFixed(2);
        }
      });
  }
}
