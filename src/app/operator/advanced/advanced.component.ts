import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-advanced",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./advanced.component.html",
  styleUrl: "./advanced.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedComponent {}
