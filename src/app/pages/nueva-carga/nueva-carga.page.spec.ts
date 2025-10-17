import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevaCargaPage } from './nueva-carga.page';

describe('NuevaCargaPage', () => {
  let component: NuevaCargaPage;
  let fixture: ComponentFixture<NuevaCargaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NuevaCargaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
