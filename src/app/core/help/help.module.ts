import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HowToComponent } from './how-to/how-to.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';


@NgModule({
  declarations: [HowToComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    MarkdownModule.forRoot({loader: HttpClient}),
  ],
})
export class HelpModule { }
