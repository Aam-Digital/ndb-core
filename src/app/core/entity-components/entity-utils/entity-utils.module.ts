import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisplayEntityComponent } from "./view-components/display-entity/display-entity.component";
import { ViewModule } from "../../view/view.module";
import { DisplayEntityArrayComponent } from "./view-components/display-entity-array/display-entity-array.component";
import { DisplayTextComponent } from "./view-components/display-text/display-text.component";
import { DisplayDateComponent } from "./view-components/display-date/display-date.component";
import { DisplayConfigurableEnumComponent } from "./view-components/display-configurable-enum/display-configurable-enum.component";
import { DisplayCheckmarkComponent } from "./view-components/display-checkmark/display-checkmark.component";
import { ReadonlyFunctionComponent } from "./view-components/readonly-function/readonly-function.component";
import { DisplayPercentageComponent } from "./view-components/display-percentage/display-percentage.component";
import { DisplayUnitComponent } from "./view-components/display-unit/display-unit.component";

@NgModule({
  declarations: [
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
  ],
  imports: [CommonModule, ViewModule],
  entryComponents: [
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
  ],
  exports: [DisplayEntityComponent],
})
export class EntityUtilsModule {}
