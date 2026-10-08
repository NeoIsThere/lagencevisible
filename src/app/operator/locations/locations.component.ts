import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../api.service';
import { Region } from '../models';

@Component({
  selector: 'app-locations', imports: [FormsModule], templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly regions = signal<Region[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly editor = signal<string | null>(null);
  readonly deleteId = signal<string | null>(null);
  name = '';
  cities = '';
  businessFamilies = '';

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { this.regions.set(await firstValueFrom(this.api.regions())); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }

  edit(region?: Region): void {
    this.name = region?.name ?? '';
    this.cities = region?.cities.join('\n') ?? '';
    this.businessFamilies = region?.businessFamilies.join('\n') ?? '';
    this.editor.set(region?.id ?? 'new');
    this.deleteId.set(null); this.error.set(''); this.notice.set('');
  }

  parseList(value: string): string[] {
    const seen = new Set<string>();
    return value.split(/\r?\n/).map(item => item.trim()).filter(item => {
      const normalized = item.normalize('NFKC').toLocaleLowerCase('fr');
      if (!item || seen.has(normalized)) return false;
      seen.add(normalized); return true;
    });
  }

  async save(): Promise<void> {
    if (this.busy()) return;
    const id = this.editor();
    if (!id) return;
    const region = { name: this.name.trim(), cities: this.parseList(this.cities), businessFamilies: this.parseList(this.businessFamilies) };
    if (!region.name || !region.cities.length || !region.businessFamilies.length) {
      this.error.set('Add a region name, at least one city and at least one business family.'); return;
    }
    if (region.name.length > 160 || [...region.cities, ...region.businessFamilies].some(item => item.length > 160)) {
      this.error.set('Region names, cities and business families must each be 160 characters or fewer.'); return;
    }
    this.busy.set(true); this.error.set(''); this.notice.set('');
    try {
      const saved = await firstValueFrom(id === 'new' ? this.api.createRegion(region) : this.api.updateRegion(id, region));
      this.regions.update(items => id === 'new' ? [...items, saved] : items.map(item => item.id === id ? saved : item));
      this.editor.set(null); this.notice.set('Region saved. Changes apply to new campaigns.');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }

  async remove(region: Region): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(''); this.notice.set('');
    try {
      await firstValueFrom(this.api.deleteRegion(region.id));
      this.regions.update(items => items.filter(item => item.id !== region.id));
      this.deleteId.set(null); this.notice.set('Region removed. Campaign history remains available.');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
