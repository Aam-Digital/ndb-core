import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../../core/entity-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { EntitySubrecordComponent } from "../../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

@DynamicComponent("Aser")
@Component({
  selector: "app-aser",
  template: ` <app-entity-subrecord
    [records]="records"
    [columns]="columns"
    [newRecordFactory]="generateNewRecordFactory()"
  ></app-entity-subrecord>`,
  standalone: true,
  imports: [EntitySubrecordComponent],
})
export class AserComponent implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records: Array<Aser> = [];

  columns: FormFieldConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "math", visibleFrom: "xs" },
    { id: "english", visibleFrom: "xs" },
    { id: "hindi", visibleFrom: "md" },
    { id: "bengali", visibleFrom: "md" },
    { id: "remarks", visibleFrom: "md" },
  ];

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }

    this.child = config.entity as Child;
    this.loadData(this.child.getId());
  }

  async loadData(id: string) {
    this.records = await this.childrenService.getAserResultsOfChild(id);
    this.records.sort(
      (a, b) =>
        (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
    );
  }

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const child = this.child.getId();

    return () => {
      const newAtt = new Aser(Date.now().toString());
      newAtt.date = new Date();
      newAtt.child = child;

      return newAtt;
    };
  }
}
