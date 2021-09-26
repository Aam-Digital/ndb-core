import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { EducationalMaterial } from "../model/educational-material";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";

@Component({
  selector: "app-educational-material",
  templateUrl: "./educational-material.component.html",
})
export class EducationalMaterialComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records: EducationalMaterial[] = [];
  summary = "";

  columns: FormFieldConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "materialType", visibleFrom: "xs", required: true },
    { id: "materialAmount", visibleFrom: "md", required: true },
    { id: "description", visibleFrom: "md" },
  ];

  constructor(private childrenService: ChildrenService) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.hasOwnProperty("child")) {
      await this.loadData(this.child.getId());
    }
  }

  async onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }

    this.child = config.entity as Child;
    await this.loadData(this.child.getId());
  }

  async loadData(id: string) {
    const results = await this.childrenService.getEducationalMaterialsOfChild(
      id
    );
    this.records = results.sort(
      (a, b) =>
        (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
    );
    this.updateSummary();
  }

  generateNewRecordFactory() {
    return () => {
      const newAtt = new EducationalMaterial(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newAtt.date = this.records.length > 0 ? this.records[0].date : new Date();
      newAtt.child = this.child.getId();
      newAtt.materialAmount = 1;

      return newAtt;
    };
  }

  updateSummary() {
    const summary = new Map<string, number>();
    this.records.forEach((m) => {
      const previousValue = summary.has(m.materialType.label)
        ? summary.get(m.materialType.label)
        : 0;
      summary.set(m.materialType.label, previousValue + m.materialAmount);
    });

    let summaryText = "";
    summary.forEach(
      (v, k) => (summaryText = summaryText + k + ": " + v + ", ")
    );
    this.summary = summaryText;
  }
}
