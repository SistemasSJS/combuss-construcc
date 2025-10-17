import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargasPage } from './cargas.page';

describe('CargasPage', () => {
  let component: CargasPage;
  let fixture: ComponentFixture<CargasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CargasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
