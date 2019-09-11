import { Directive, Input, Output, EventEmitter, HostListener, ChangeDetectorRef, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from "rxjs/Subject";
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import { Subscription } from "rxjs/Subscription";

/**
 * Generated class for the DebouncedInputDirective directive.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/DirectiveMetadata-class.html
 * for more info on Angular Directives.
 */
@Directive({
  selector: '[debounced-input][ngModel]' // Attribute selector
})
export class DebouncedInputDirective implements OnChanges {  

  @Input('ngModel') debouncedModel: any;  

  // Ref.: https://stackoverflow.com/questions/34990102/angular2-data-binding-for-custom-reusable-component
  // note that this must be named as the input name + "Change"
  // See https://blog.thoughtram.io/angular/2016/10/13/two-way-data-binding-in-angular-2.html
  @Output() debouncedModelChange: any = new EventEmitter();  
  
  modelChanged: Subject<any> = new Subject<any>();  
  modelChangeSubscription: Subscription;
  onChangesCallback: Function;

  private updateData(data: any) {    
    this.modelChanged.next(data);    
  }

  ngOnChanges(changes: SimpleChanges): void {  
    if('debouncedModel' in changes) {      
      this.updateData(changes.debouncedModel.currentValue);       
      this.onChangesCallback();              
    }    
  }
  ngOnDestroy() {
    this.modelChangeSubscription.unsubscribe();
  }  

  constructor(private ref: ChangeDetectorRef,
    private zone: NgZone) {  
    // Ref: https://www.lucidchart.com/techblog/2016/05/04/angular-2-best-practices-change-detector-performance/
    this.onChangesCallback = () => {
      zone.run(() => {
        ref.markForCheck();
      });
    };  

    // Ref.: https://stackoverflow.com/questions/32051273/angular-and-debounce
    this.modelChangeSubscription = this.modelChanged
    .debounceTime(300) // wait 300ms after the last event before emitting last event
    .distinctUntilChanged() // only emit if value is different from previous value     
    .subscribe(data => {      
        this.debouncedModel = data;
        this.debouncedModelChange.emit(data); 
    });
  }

}