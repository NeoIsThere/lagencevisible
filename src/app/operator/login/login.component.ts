import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  selector: "app-login",
  imports: [FormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  username = "";
  password = "";
  readonly busy = signal(false);
  readonly error = signal("");

  async ngOnInit(): Promise<void> {
    this.busy.set(true);
    try {
      if (await this.auth.restore()) await this.router.navigateByUrl("/operator/candidates");
    } finally {
      this.busy.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      await this.auth.login(this.username.trim(), this.password);
      const target = this.route.snapshot.queryParamMap.get("returnUrl") ?? "/operator/candidates";
      const safeTarget = target === "/operator" || target.startsWith("/operator/");
      await this.router.navigateByUrl(safeTarget ? target : "/operator/candidates");
    } catch (error) {
      this.error.set(error instanceof HttpErrorResponse && error.status === 401
        ? "Invalid username or password."
        : error instanceof HttpErrorResponse && error.status === 429
          ? "Too many login attempts. Try again later."
          : "Unable to log in. Check the backend connection and try again.");
    } finally {
      this.password = "";
      this.busy.set(false);
    }
  }
}
