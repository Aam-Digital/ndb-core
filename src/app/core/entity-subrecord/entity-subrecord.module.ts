import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { KeysPipe } from "./keys-pipe/keys.pipe";

@NgModule({
  declarations: [EntitySubrecordComponent, KeysPipe],
  imports: [CommonModule],
  exports: [EntitySubrecordComponent, KeysPipe],
})
export class EntitySubrecordModule {}
