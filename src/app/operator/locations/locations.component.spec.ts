import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LocationsComponent } from './locations.component';

describe('Locations', () => {
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [LocationsComponent], providers: [provideHttpClient(), provideHttpClientTesting()] }).compileComponents(); });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('saves city order and trims repeated lines in the simple region model', async () => {
    const component = TestBed.createComponent(LocationsComponent).componentInstance;
    component.edit(); component.name = ' Région test '; component.cities = 'Antibes\nNice\n antibes \n\nCannes'; component.businessFamilies = 'Plombiers\nÉlectriciens';
    const saving = component.save();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/regions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Région test', cities: ['Antibes', 'Nice', 'Cannes'], businessFamilies: ['Plombiers', 'Électriciens'] });
    request.flush({ id: 'region-1', ...request.request.body }); await saving;
    expect(component.regions()[0].cities).toEqual(['Antibes', 'Nice', 'Cannes']);
    expect(component.editor()).toBeNull();
  });

  it('requires a city and a business family before saving', async () => {
    const component = TestBed.createComponent(LocationsComponent).componentInstance;
    component.edit(); component.name = 'Region'; component.cities = 'Nice';
    await component.save();
    TestBed.inject(HttpTestingController).expectNone('/api/regions');
    expect(component.error()).toContain('at least one business family');
  });
});
