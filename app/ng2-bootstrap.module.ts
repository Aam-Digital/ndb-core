import {NgModule}           from '@angular/core';
import {CommonModule} from "@angular/common";
import {AlertComponent, ModalDirective} from "ng2-bootstrap/ng2-bootstrap";

@NgModule({
    imports: [CommonModule],
    declarations: [AlertComponent, ModalDirective],
    exports: [AlertComponent, ModalDirective],
})
export class NG2BootstrapModule {
}
