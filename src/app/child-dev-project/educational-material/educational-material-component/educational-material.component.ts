import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { EducationalMaterial } from "../model/educational-material";
import { ChildrenService } from "../../children/children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";

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
    {
      name: "date",
      label: $localize`Date`,
      inputType: ColumnDescriptionInputType.DATE,
      visibleFrom: "xs",
    },
    {
      name: "materialType",
      label: $localize`:Education material type:Material`,
      inputType: ColumnDescriptionInputType.AUTOCOMPLETE,
      selectValues: this.materialTypes.map((t) => {
        return { value: t, label: t };
      }),
      visibleFrom: "xs",
    },
    {
      name: "materialAmount",
      label: $localize`:Amount of Education material:Amount`,
      inputType: ColumnDescriptionInputType.NUMBER,
      visibleFrom: "md",
    },
    {
      name: "description",
      label: $localize`Description/Remarks`,
      inputType: ColumnDescriptionInputType.TEXT,
      visibleFrom: "md",
    },
  ];

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges): void {
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
