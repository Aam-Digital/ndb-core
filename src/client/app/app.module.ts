import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';

import {AppComponent} from './app.component';
import { routing } from './app.routing';
import {SessionModule} from './session/session.module';
import {DashboardModule} from './dashboard/dashboard.module';
import {UIModule} from './ui/ui.module';

@NgModule({
    imports: [
        BrowserModule,
        routing,
        FormsModule,
        SessionModule,
        DashboardModule,
        UIModule
        // UserModule is lazy loaded
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
}
