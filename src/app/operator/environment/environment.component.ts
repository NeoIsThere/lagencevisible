import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../api.service";
import type { EnvironmentVariable } from "../models";

@Component({
  selector: "app-environment",
  imports: [FormsModule],
  templateUrl: "./environment.component.html",
  styleUrl: "./environment.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly variables = signal<EnvironmentVariable[]>([]);
  readonly filter = signal("");
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly visibleVariables = computed(() => {
    const query = this.filter().trim().toLowerCase();
    if (!query) return this.variables();
    return this.variables().filter((variable) => variable.name.toLowerCase().includes(query));
  });
  readonly configuredCount = computed(() => this.variables().filter((variable) => variable.configured).length);

  constructor() {
    this.load();
  }

  updateFilter(value: string): void {
    this.filter.set(value);
  }

  displayValue(variable: EnvironmentVariable): string {
    if (variable.redacted) return variable.configured ? "Masked" : "Not set";
    return variable.value || "Not set";
  }

  refresh(): void {
    if (this.loading()) return;
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.environment().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ variables }) => {
        this.variables.set(variables);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Environment unavailable.");
      },
    });
  }
}
