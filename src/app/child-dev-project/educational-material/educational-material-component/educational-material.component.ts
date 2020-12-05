import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DatePipe } from "@angular/common";
import { EducationalMaterial } from "../model/educational-material";
import { ColumnDescription } from "../../../core/entity-subrecord/entity-subrecord/column-description";
import { ChildrenService } from "../../children/children.service";
import { ColumnDescriptionInputType } from "../../../core/entity-subrecord/entity-subrecord/column-description-input-type.enum";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";

@UntilDestroy()
@Component({
  selector: "app-educational-material",
  templateUrl: "./educational-material.component.html",
})
export class EducationalMaterialComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records = new Array<EducationalMaterial>();

  materialTypes = EducationalMaterial.MATERIAL_ALL;

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
      "materialType",
      "Material",
      ColumnDescriptionInputType.AUTOCOMPLETE,
      this.materialTypes.map((t) => {
        return { value: t, label: t };
      }),
      undefined,
      "xs"
    ),
    new ColumnDescription(
      "materialAmount",
      "Amount",
      ColumnDescriptionInputType.NUMBER,
      null,
      undefined,
      "md"
    ),
    new ColumnDescription(
      "description",
      "Description/Remarks",
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

  ngOnChanges(changes: SimpleChanges): void {
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
      .getEducationalMaterialsOfChild(id)
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
      const newAtt = new EducationalMaterial(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newAtt.date = this.records.length > 0 ? this.records[0].date : new Date();
      newAtt.child = child;

      return newAtt;
    };
  }

  getSummary() {
    if (this.records.length === 0) {
      return "";
    }

    const summary = new Map<string, number>();
    this.records.forEach((m) => {
      const previousValue = summary.has(m.materialType)
        ? summary.get(m.materialType)
        : 0;
      summary.set(m.materialType, previousValue + m.materialAmount);
    });

    let summaryText = "";
    summary.forEach(
      (v, k) => (summaryText = summaryText + k + ": " + v + ", ")
    );
    return summaryText;
  }
}
