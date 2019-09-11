import { Injectable } from '@angular/core';
import { NavController, NavParams, ModalController,LoadingController } from 'ionic-angular';
// import { Component,OnInit } from '@angular/core';
import { Http, Headers, Response, RequestOptions, URLSearchParams } from '@angular/http';
import { Platform, ToastController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/toPromise';
import { AuthenticationService } from "./authentication";
import { ConfigService } from "./config";
import { Storage } from '@ionic/storage';


@Injectable()
export class UploadAssignmentService {  

    public user:any;
    public baseUrl:string;
    public token:string;
    public assignmentobservable:Observable<any>;
    private observable: Observable<any>; //Tracks request in progress
    public assignment_id:number;
    public assignments:any;

    public assignment_res_data_service:any;
        constructor(
            private http:Http,
            private platform : Platform,
            private storage: Storage,
            private toastCtrl: ToastController,
            private auth:AuthenticationService,
            private config:ConfigService,
             private loadingCtrl:LoadingController
            ){
            this.baseUrl = this.config.baseUrl; 

        }

        get_assignment_data($assignment_id,$force=null)
        {   

            //console.log('## -> condition check for assignmentId = '+this.loadedassignments.length+' LEngth = '+this.loadedassignments[0]+' chek for ' +$assignment_id +' = '+this.loadedassignments.indexOf($assignment_id));

            if(this.config.track.assignments.indexOf($assignment_id) >=0 && !$force){
                    return Observable.fromPromise(
                        this.storage.get('assignment_'+$assignment_id).then((assignment) => {
                            this.assignment_res_data_service = assignment;
                            return assignment;
                        })
                    );
                
            }else{
               
                let opt = this.auth.getUserAuthorizationHeaders(); 
                this.assignmentobservable =  this.http.post(`${this.config.baseUrl}user/content/assignmentId/`+$assignment_id,{},opt)
                 .map(response =>{  
                    let body = response.json();
                    this.assignment_res_data_service=body;
                    this.storage.set('assignment_'+$assignment_id,this.assignment_res_data_service);
                    this.config.addToTracker('assignments',body.id);
                    return body;
                });
            }
          
            return this.assignmentobservable; 
        }

        upload_assignment_data($assignment_id,value)
        {   
            // for body form set 
            var options = {};
            let body_form_data    = new FormData();
            body_form_data.append('file', value.file);
            body_form_data.append('comment',value.comment_content);

            let opt = this.auth.getUserAuthorizationHeaders(); 

            this.assignmentobservable = this.http.post(`${this.config.baseUrl}user/upload/assignmentId/`+$assignment_id,body_form_data,opt)
            .map(response =>{  
                let body = response.json();

                let toast = this.toastCtrl.create({
                    message: body.message ,
                    duration: 500,
                    position: 'bottom'
                });
                toast.present();
                this.assignment_res_data_service.attachment_url=body.attachment_url;
                this.assignment_res_data_service.comment_content=body.comment_content;
                 
                return body;
            });
            return this.assignmentobservable; 
        }

        start_assignment($assignment_id)
        {

            var data={};
            let opt = this.auth.getUserAuthorizationHeaders(); 
            this.assignmentobservable = this.http.post(`${this.config.baseUrl}user/start/assignmentId/`+$assignment_id,data,opt)
             .map(response =>{  

                let body = response.json();
                this.assignment_res_data_service.flag=1;
                this.assignment_res_data_service.message=body.message;
                this.assignment_res_data_service.start=body.start;
                this.assignment_res_data_service.duration=body.duration;

                this.storage.set('assignment_'+$assignment_id,this.assignment_res_data_service);

                this.config.addToTracker('assignments',body.id);

                let toast = this.toastCtrl.create({
                    message: body.message ,
                    duration: 500,
                    position: 'bottom'
                });
                toast.present();
                return body;
            });
            return this.assignmentobservable; 
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

        if(time <= 0){

          return this.config.get_translation('expired');
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
       return time_labels;
    }
}        