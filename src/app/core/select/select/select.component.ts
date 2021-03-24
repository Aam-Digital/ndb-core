import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../entity/entity";

@Component({
  selector: "app-select",
  templateUrl: "./select.component.html",
  styleUrls: ["./select.component.scss"],
})
export class SelectComponent<T extends Entity> implements OnInit {
  @Input() label: string;

  @Input() selectedEntities: T[] = [];
  constructor() {}

  ngOnInit(): void {}
}
