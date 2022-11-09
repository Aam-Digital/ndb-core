import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScreenWidthObserver } from "./screen-size-observer.service";

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [ScreenWidthObserver],
})
export class MediaModule {}
