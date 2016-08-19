import { NgModule }           from '@angular/core';
import { UserAccountComponent } from "./user-account.component";
import { routing } from "./user.routing";

@NgModule({
    imports: [routing],
    declarations: [UserAccountComponent],
    exports: [],
    providers: []
})
export default class UserModule {
}
