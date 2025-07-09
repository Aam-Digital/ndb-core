import { Component, inject, OnInit } from "@angular/core";
import { Angulartics2Module } from "angulartics2";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButton } from "@angular/material/button";
import { ThirdPartyAuthenticationService } from "../third-party-authentication.service";
import { Logging } from "../../../core/logging/logging.service";

/**
 * A simple button that allows the user to navigate to the external system
 * through which that user session has been authenticated via the
 * third-party-authentication API.
 * (usually displayed in the main navigation menu)
 */
@Component({
  selector: "app-goto-third-party-system",
  imports: [Angulartics2Module, FaIconComponent, MatButton],
  templateUrl: "./goto-third-party-system.component.html",
  styleUrl: "./goto-third-party-system.component.scss",
})
export class GotoThirdPartySystemComponent implements OnInit {
  sessionId: string;

  private readonly thirdPartyAuthService = inject(
    ThirdPartyAuthenticationService,
  );

  ngOnInit() {
    this.sessionId = this.thirdPartyAuthService.getSessionId();
  }

  async goToExternalRedirect() {
    const redirectUrl = await this.thirdPartyAuthService.getRedirectUrl();
    if (!redirectUrl) {
      Logging.warn("TPA: unexpected undefined redirect URL");
      return;
    }

    window.open(redirectUrl, "_blank");
  }
}
