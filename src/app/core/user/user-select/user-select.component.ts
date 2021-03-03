import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { User } from "../user";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { AlertService } from "../../alerts/alert.service";
import { LoggingService } from "../../logging/logging.service";

@Component({
  selector: "app-user-select",
  templateUrl: "./user-select.component.html",
  styleUrls: ["./user-select.component.scss"],
})
export class UserSelectComponent implements OnInit {
  @Input() user: string;
  @Output() userChange = new EventEmitter<string>();

  users: User[];
  suggestions: User[];

  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.entityMapperService
      .loadType<User>(User)
      .then((users) => {
        this.users = users;
        this.onInputChanged();
      })
      .catch((reason) => {
        this.alertService.addWarning("Cannot load Users");
        this.loggingService.warn(reason);
        this.users = [];
        this.suggestions = [];
      });
  }

  selectUser(user: User) {
    this.user = user.name;
    this.userChange.emit(this.user);
  }

  onInputChanged(): void {
    this.suggestions = this.users.filter((otherUser) =>
      otherUser.name.toLowerCase().startsWith(this.user)
    );
    this.userChange.emit(this.user);
  }
}
