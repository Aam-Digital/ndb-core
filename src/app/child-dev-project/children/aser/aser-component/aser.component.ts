import { Component, Input, OnInit } from "@angular/core";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntitiesTableComponent } from "../../../../core/common-components/entities-table/entities-table.component";
import { ColumnConfig } from "../../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

@DynamicComponent("Aser")
@Component({
  selector: "app-aser",
  template: `<app-entities-table
    [entityType]="entityCtr"
    [records]="records"
    [customColumns]="config.columns"
    [newRecordFactory]="generateNewRecordFactory()"
  ></app-entities-table>`,
  standalone: true,
  imports: [EntitiesTableComponent],
})
export class AserComponent implements OnInit {
  @Input() entity: Child;
  @Input() config: { columns: ColumnConfig[] } = {
    columns: [
      { id: "date", visibleFrom: "xs" },
      { id: "math", visibleFrom: "xs" },
      { id: "english", visibleFrom: "xs" },
      { id: "hindi", visibleFrom: "md" },
      { id: "bengali", visibleFrom: "md" },
      { id: "remarks", visibleFrom: "md" },
    ],
  };
  records: Aser[];
  entityCtr = Aser;

  constructor(private childrenService: ChildrenService) {}

  ngOnInit() {
    return this.loadData();
  }

  async loadData() {
    this.records = await this.childrenService.getAserResultsOfChild(
      this.entity.getId(),
    );
    this.records.sort(
      (a, b) =>
        (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0),
    );
  }

  generateNewRecordFactory() {
    return () => {
      const newAtt = new Aser(Date.now().toString());
      newAtt.child = this.entity.getId();
      return newAtt;
    };
  }
}
