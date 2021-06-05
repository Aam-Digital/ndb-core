import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children/children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";

function createColumnDescription(
  name: string,
  label: string,
  visibleFrom: "md" | "xs" = "md",
  inputType = ColumnDescriptionInputType.SELECT
): ColumnDescription {
  return {
    name: name,
    label: label,
    inputType: inputType,
    selectValues: Aser.ReadingLevels.map((s) => {
      return { value: s, label: s };
    }),
    visibleFrom: visibleFrom,
  };
}

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
    createColumnDescription("name", $localize`Date`),
    createColumnDescription("math", $localize`:Math as a subject:Math`),
    createColumnDescription(
      "english",
      $localize`:English as a subject in school:English`
    ),
    createColumnDescription(
      "hindi",
      $localize`:Hindi as a subject in school:Hindi`,
      "md"
    ),
    createColumnDescription(
      "bengali",
      $localize`:Bengali as a subject in school:Bengali`,
      "md"
    ),
    createColumnDescription(
      "remarks",
      $localize`Remarks`,
      "md",
      ColumnDescriptionInputType.TEXT
    ),
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
