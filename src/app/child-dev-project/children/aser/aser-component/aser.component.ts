import { Component, Input, OnInit } from "@angular/core";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { EntitySubrecordComponent } from "../../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { ColumnConfig } from "../../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { NgIf } from "@angular/common";

@DynamicComponent("Aser")
@Component({
  selector: "app-aser",
  template: ` <app-entity-subrecord
    [records]="records"
    [columns]="config.columns"
    [newRecordFactory]="generateNewRecordFactory()"
  ></app-entity-subrecord>`,
  standalone: true,
  imports: [EntitySubrecordComponent, NgIf],
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

  constructor(private childrenService: ChildrenService) {}

  ngOnInit() {
    return this.loadData();
  }

  async loadData() {
    this.records = await this.childrenService.getAserResultsOfChild(
      this.entity.getId()
    );
    this.records.sort(
      (a, b) =>
        (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
    );
  }

  generateNewRecordFactory() {
    return () => {
      const newAtt = new Aser(Date.now().toString());
      newAtt.date = new Date();
      newAtt.child = this.entity.getId();
      return newAtt;
    };
  }
}
