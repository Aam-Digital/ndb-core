import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatInput } from "@angular/material/input";

@Component({
  selector: "app-json-editor",
  standalone: true,
  imports: [MatInput],
  templateUrl: "./json-editor.component.html",
  styleUrl: "./json-editor.component.scss",
})
export class JsonEditorComponent {
  /**
   * JSON value to be edited by user.
   */
  @Input() value: any;

  @Output() valueChange = new EventEmitter<any>();

  // TODO: research if there are json editor components on npm
}
