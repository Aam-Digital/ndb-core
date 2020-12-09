import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityListComponent } from "./entity-list.component";
import { DisplayTextComponent } from "./display-text/display-text.component";
import { DisplayDateComponent } from "./display-date/display-date.component";
import { DisplayCheckmarkComponent } from "./display-checkmark/display-checkmark.component";

@NgModule({
  declarations: [
    EntityListComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayCheckmarkComponent,
  ],
  imports: [CommonModule],
  exports: [EntityListComponent],
})
export class EntityListModule {}
