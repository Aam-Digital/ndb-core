import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { EducationalMaterial } from "../model/educational-material";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

/**
 * Displays educational materials of a child, such as a pencil, rulers, e.t.c
 * as well as a summary
 */
@DynamicComponent("EducationalMaterial")
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
    { id: "materialType", visibleFrom: "xs" },
    { id: "materialAmount", visibleFrom: "md" },
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

  /**
   * Loads the data for a given child and updates the summary
   * @param id The id of the child to load the data for
   */
  async loadData(id: string) {
    this.records = await this.childrenService.getEducationalMaterialsOfChild(
      id
    );
    this.updateSummary();
  }

  newRecordFactory = () => {
    const newAtt = new EducationalMaterial(Date.now().toString());

    // use last entered date as default, otherwise today's date
    newAtt.date = this.records.length > 0 ? this.records[0].date : new Date();
    newAtt.child = this.child.getId();
    newAtt.materialAmount = 1;

    return newAtt;
  };

  /**
   * update the summary or generate a new one.
   * The summary contains no duplicates and is in a
   * human-readable format
   */
  updateSummary() {
    const summary = new Map<string, number>();
    this.records.forEach((m) => {
      const previousValue = summary.has(m.materialType.label)
        ? summary.get(m.materialType.label)
        : 0;
      summary.set(m.materialType.label, previousValue + m.materialAmount);
    });
    this.summary = [...summary]
      .map(([key, value]) => key + ": " + value)
      .join(", ");
  }
}
