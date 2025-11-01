import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RendimientoPage } from './rendimiento.page';

describe('RendimientoPage', () => {
  let component: RendimientoPage;
  let fixture: ComponentFixture<RendimientoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RendimientoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
