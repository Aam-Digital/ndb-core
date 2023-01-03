import { NgModule } from "@angular/core";
import { WINDOW_TOKEN } from "../../utils/di-tokens";

@NgModule({
  providers: [{ provide: WINDOW_TOKEN, useValue: window }],
})
export class PwaInstallModule {}
