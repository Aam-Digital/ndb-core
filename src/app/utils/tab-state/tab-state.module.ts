import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TabStateMemoDirective } from "./tab-state-memo.directive";

@NgModule({
  declarations: [TabStateMemoDirective],
  imports: [CommonModule],
  exports: [TabStateMemoDirective],
})
export class TabStateModule {}
