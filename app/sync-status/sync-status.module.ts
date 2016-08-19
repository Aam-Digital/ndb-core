import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NG2BootstrapModule} from "../ng2-bootstrap.module";
import {SyncStatusComponent} from "./sync-status.component";


@NgModule({
    imports: [CommonModule, NG2BootstrapModule],
    declarations: [SyncStatusComponent],
    exports: [SyncStatusComponent],
    providers: []
})
export class SyncStatusModule {

}
