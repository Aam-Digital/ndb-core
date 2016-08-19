import { RouterModule } from "@angular/router";
import { UserAccountComponent } from "./user-account.component";

export const routing = RouterModule.forChild([
    {path: 'user', component: UserAccountComponent}
]);
