import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children/children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";

@UntilDestroy()
@Component({
  selector: "app-aser",
  template:
    '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()">' +
    "</app-entity-subrecord>",
})
export class AserComponent implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records: Array<Aser>;

  columns: Array<ColumnDescription> = [
    {
      name: "date",
      label: "Date",
      inputType: ColumnDescriptionInputType.DATE,
      visibleFrom: "xs",
    },
    {
      name: "math",
      label: "Math",
      inputType: ColumnDescriptionInputType.SELECT,
      selectValues: Aser.MathLevels.map((s) => {
        return { value: s, label: s };
      }),
      visibleFrom: "xs",
    },
    {
      name: "english",
      label: "English",
      inputType: ColumnDescriptionInputType.SELECT,
      selectValues: Aser.ReadingLevels.map((s) => {
        return { value: s, label: s };
      }),
      visibleFrom: "xs",
    },
    {
      name: "hindi",
      label: "Hindi",
      inputType: ColumnDescriptionInputType.SELECT,
      selectValues: Aser.ReadingLevels.map((s) => {
        return { value: s, label: s };
      }),
      visibleFrom: "md",
    },
    {
      name: "bengali",
      label: "Bengali",
      inputType: ColumnDescriptionInputType.SELECT,
      selectValues: Aser.ReadingLevels.map((s) => {
        return { value: s, label: s };
      }),
      visibleFrom: "md",
    },
    {
      name: "remarks",
      label: "Remarks",
      inputType: ColumnDescriptionInputType.TEXT,
      visibleFrom: "md",
    },
  ];

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.displayedColumns) {
      this.columns = this.columns.filter((c) =>
        config.config.displayedColumns.includes(c.name)
      );
    }

    this.child = config.entity as Child;
    this.loadData(this.child.getId());
  }

  loadData(id: string) {
    this.childrenService
      .getAserResultsOfChild(id)
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        this.records = results.sort(
          (a, b) =>
            (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
        );
      });
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
