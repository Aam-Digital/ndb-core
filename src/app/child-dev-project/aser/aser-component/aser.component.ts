import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children/children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";

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
    new ColumnDescription(
      "date",
      "Date",
      ColumnDescriptionInputType.DATE,
      null,
      (v: Date) => this.datePipe.transform(v, "yyyy-MM-dd"),
      "xs"
    ),
    new ColumnDescription(
      "math",
      "Math",
      ColumnDescriptionInputType.SELECT,
      Aser.MathLevels.map((s) => {
        return { value: s, label: s };
      }),
      undefined,
      "xs"
    ),
    new ColumnDescription(
      "english",
      "English",
      ColumnDescriptionInputType.SELECT,
      Aser.ReadingLevels.map((s) => {
        return { value: s, label: s };
      }),
      undefined,
      "xs"
    ),
    new ColumnDescription(
      "hindi",
      "Hindi",
      ColumnDescriptionInputType.SELECT,
      Aser.ReadingLevels.map((s) => {
        return { value: s, label: s };
      }),
      undefined,
      "md"
    ),
    new ColumnDescription(
      "bengali",
      "Bengali",
      ColumnDescriptionInputType.SELECT,
      Aser.ReadingLevels.map((s) => {
        return { value: s, label: s };
      }),
      undefined,
      "md"
    ),
    new ColumnDescription(
      "remarks",
      "Remarks",
      ColumnDescriptionInputType.TEXT,
      null,
      undefined,
      "md"
    ),
  ];

  constructor(
    private childrenService: ChildrenService,
    private datePipe: DatePipe
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.child = config.entity;
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
