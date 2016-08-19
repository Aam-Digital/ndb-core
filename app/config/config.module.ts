import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfigService} from "./config.service";

@NgModule({
    imports: [CommonModule],
    declarations: [],
    exports: [],
    providers: [ConfigService]
})
export class ConfigModule {
}
