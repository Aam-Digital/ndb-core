import { NgModule } from '@angular/core';
import { NavigationModule } from "../navigation/navigation.module";
import { SessionModule } from "../session/session.module";
import { UIComponent } from "./ui.component";
import { FooterComponent } from "./footer.component";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";

@NgModule({
    imports: [BrowserModule, RouterModule, SessionModule, NavigationModule],
    declarations: [UIComponent, FooterComponent],
    exports: [UIComponent],
    providers: []
})
export class UIModule {
}
