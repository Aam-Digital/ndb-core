import {NgModule}           from '@angular/core';
import {CommonModule}       from '@angular/common';

import {DashboardComponent} from "./dashboard.component";


@NgModule({
    imports: [CommonModule],
    declarations: [DashboardComponent],
    exports: [DashboardComponent],
    providers: []
})
export class DashboardModule {

}
