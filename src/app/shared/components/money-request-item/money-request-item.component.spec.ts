import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyRequestItemComponent } from './money-request-item.component';

describe('MoneyRequestItemComponent', () => {
  let component: MoneyRequestItemComponent;
  let fixture: ComponentFixture<MoneyRequestItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyRequestItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoneyRequestItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
