import { Component , Input, OnInit, Output, EventEmitter  } from '@angular/core';
import { NavController,NavParams,LoadingController, ToastController, Slides,Platform } from 'ionic-angular';
import { ConfigService } from '../../services/config';


@Component({
  selector: 'MessageBlock',
  templateUrl: 'messageblock.html'
})
export class MessageBlock implements OnInit   {
	@Input('chat') chat;
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private config:ConfigService
 	){}

    ngOnInit(){
    }


    getMessageLastTime(message){
        let new_time= Math.floor((new Date().getTime() -message.time)/1000);
        return this.toFriendlyTime(new_time);
    }


    toFriendlyTime(time){
        let count:number = 0;
        let time_labels: string;
        let measure:any;
        let key: number;
        let small_measure:any;
        let small_count:number = 0;
        let measures = [
            {   
                'label': this.config.get_translation('year'),
                'multi':this.config.get_translation('years'), 
                'value':946080000
            },
            {
                'label':this.config.get_translation('month'),
                'multi':this.config.get_translation('months'), 
                'value':2592000
            },
            {
                'label':this.config.get_translation('week'),
                'multi':this.config.get_translation('weeks'), 
                'value':604800
            },
            {
                'label':this.config.get_translation('day'),
                'multi':this.config.get_translation('days'), 
                'value':86400
            },
            {
                'label':this.config.get_translation('hour'),
                'multi':this.config.get_translation('hours'), 
                'value':3600
            },
            {
                'label':this.config.get_translation('minute'),
                'multi':this.config.get_translation('minutes'), 
                'value':60
            },
            {
                'label':this.config.get_translation('second'),
                'multi':this.config.get_translation('seconds'), 
                'value':1
            },
        ];

        if(time < 0){

          return this.config.get_translation('expired');
        }
        if(time ==0){
             return this.config.get_translation('just_now');
        }
        

        for(let i=0;i<measures.length;i++){
            measure = measures[i];
            key = i;
            if(measure.value < time ){
                count = Math.floor(time/measure.value);
                break;
            }
        }
        
        time_labels = count+' '+((count > 1)?measure.multi:measure.label);
       
        if(measure.value > 1){ // Ensure we're not on last element
          small_measure = measures[key+1];  
          small_count = Math.floor((time%measure.value)/small_measure.value);
          if(small_count)
            time_labels += ', '+small_count+' '+((small_count > 1)?small_measure.multi:small_measure.label);
        }  
        return time_labels
    } 
    
    mimeCheck(attachment_type){
        if(attachment_type.search('image')>=0){
            return true;
        }else{
            return false;
        }
    } 


}
