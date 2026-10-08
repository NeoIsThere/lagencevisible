import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "./auth.service";

@Component({
  selector: "app-operator-shell",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./operator-shell.component.html",
  styleUrl: "./operator-shell.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly logoutError = signal("");
  readonly loggingOut = signal(false);

  async logout(): Promise<void> {
    this.logoutError.set("");
    this.loggingOut.set(true);
    try {
      await this.auth.logout();
      await this.router.navigateByUrl("/login");
    } catch {
      this.logoutError.set("Unable to log out. Please try again.");
    } finally {
      this.loggingOut.set(false);
    }
  }
}
