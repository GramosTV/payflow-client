import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyRequestsComponent } from './money-requests.component';

describe('MoneyRequestsComponent', () => {
  let component: MoneyRequestsComponent;
  let fixture: ComponentFixture<MoneyRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
