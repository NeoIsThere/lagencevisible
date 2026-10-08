import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApiService, errorMessage, readable } from '../api.service';
import { Configuration, Connections } from '../models';

@Component({
  selector: 'app-configuration', imports: [FormsModule, DatePipe], templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly config = signal<Configuration | null>(null);
  readonly connections = signal<Connections>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly checking = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly readable = readable;
  maxLeads = 5;
  maxDurationHours = 3;
  maxApiCostUsd = 2;

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.error.set(''); this.loading.set(true);
    try {
      const result = await firstValueFrom(forkJoin({ config: this.api.configuration(), connections: this.api.connections() }));
      this.config.set(result.config); this.connections.set(result.connections);
      this.maxLeads = result.config.settings.maxLeads;
      this.maxDurationHours = result.config.settings.maxDurationMinutes / 60;
      this.maxApiCostUsd = result.config.settings.maxApiCostUsd;
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    const minutes = this.maxDurationHours * 60;
    if (!Number.isInteger(this.maxLeads) || this.maxLeads < 1 || !Number.isFinite(minutes) || minutes < 1 || Math.abs(minutes - Math.round(minutes)) > .0001) {
      this.error.set('Enter a positive whole number of leads and a duration of at least one whole minute.'); return;
    }
    const cents = Math.round(this.maxApiCostUsd * 100);
    if (!Number.isFinite(this.maxApiCostUsd) || this.maxApiCostUsd < .01 || this.maxApiCostUsd > 10000 || Math.abs(this.maxApiCostUsd * 100 - cents) > .000001) {
      this.error.set('Enter an API budget from $0.01 to $10,000.00, with at most two decimal places.'); return;
    }
    this.saving.set(true); this.error.set(''); this.notice.set('');
    try {
      this.config.set(await firstValueFrom(this.api.saveSettings({ maxLeads: this.maxLeads, maxDurationMinutes: Math.round(minutes), maxApiCostUsd: cents / 100 })));
      this.notice.set('Configuration saved. These limits apply to new campaigns.');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.saving.set(false); }
  }

  async check(): Promise<void> {
    if (this.checking()) return;
    this.checking.set(true); this.error.set('');
    try { this.connections.set(await firstValueFrom(this.api.checkConnections())); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.checking.set(false); }
  }

  environment(): Array<{ name: string; value: string }> {
    const names: Record<string, string> = { publicAppUrl: 'Application URL', authenticationConfigured: 'Operator authentication', discoveryConfigured: 'Search API credentials', browserAvailable: 'Website browser', mcpConfigured: 'MCP authentication', mcpEndpoint: 'MCP endpoint', aiProcessing: 'AI processing', emailSending: 'Email sending' };
    return Object.entries(this.config()?.environment ?? {}).map(([key, value]) => ({
      name: names[key] ?? readable(key.replace(/([a-z])([A-Z])/g, '$1 $2')),
      value: typeof value === 'boolean' ? (['aiProcessing', 'emailSending'].includes(key) ? value ? 'Enabled' : 'Disabled' : value ? 'Ready' : 'Not configured') : typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value),
    }));
  }
  positive(status: string): boolean { return ['connected', 'ok', 'available', 'healthy', 'ready'].includes(status); }
}
