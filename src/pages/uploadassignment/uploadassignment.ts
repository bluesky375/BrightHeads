import { Component,OnInit } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { NavController, NavParams, ModalController,LoadingController } from 'ionic-angular';
import { AlertController, ActionSheetController ,ToastController} from 'ionic-angular';
// import { FormBuilder, FormGroup,FormControl, Validators, } from '@angular/forms';
// import { FormGroup,FormControl, Validators } from '@angular/forms';
import { FormGroup,FormControl, Validators } from '@angular/forms';


import { UploadAssignmentService } from "../../services/upload_assignment";
import { CourseStatusService } from "../../services/status"; 
import { ConfigService } from '../../services/config';
import { Observable } from 'rxjs/Observable';
import { Chart } from 'chart.js';

import { Storage } from '@ionic/storage';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';


@Component({
  selector: 'page-uploadassignment',
  templateUrl: 'uploadassignment.html',
})
export class UploadAssignmentPage  implements OnInit  {

	    public assignment_data:any;
	    public assignment_res_data:any;
	    public loading=0;
	    public imageURI :any;
	    public presentToast:any; 
		public imageFileName:any;
		public commentForm: FormGroup;
		// file: File;
		public file:any;
		public timerVar:any;
		public timerVal:any;
		public days:any;
		public hours:any;
		public minutes:any;
		public seconds:any;
		public time:any;
		public timer_end=0;
		public current_unit_id:any;
		public coursestatus:any;
		public current_i:any;
		constructor(
				   public navCtrl: NavController,
				   public navParams: NavParams,
				   public upload_assignment:UploadAssignmentService,
				   public statusservice:CourseStatusService,	
		       	   public alertCtrl:AlertController,
		       	   private loadingController:LoadingController,
		       	   public config:ConfigService,
		  		   private camera: Camera,
		  		   private storage:Storage,
       			   private action:ActionSheetController,
       			   private transfer: FileTransfer,
       			   private toastCtrl: ToastController,
  		   ) { 
				console.log('constructor upload assignment page');
				
		}
		ngOnInit(){


			this.timerVar=Observable.interval(1000000).subscribe( x=>{});   // initialzile for ion view did leave so that no error occure
            this.initializeForm();   // Initialize form content
		    console.log('assignment data---');
			this.assignment_data=this.navParams.data; 
			this.current_unit_id=this.assignment_data.current_unit_id;
			this.coursestatus=JSON.parse(this.navParams.data.coursestatus);   // necessary  structure circular error 
			this.current_i=this.navParams.data.current_i;
			
           let loading = this.loadingController.create({
		          content: '<img src="assets/images/bubbles.svg">',
		          duration: 15000,//this.config.get_translation('loadingresults'),
		          spinner:'hide',
		          showBackdrop:true,

		      });
            loading.present();
           
				this.upload_assignment.get_assignment_data(this.assignment_data.id).subscribe(res=>{ 
			        if(this.upload_assignment.assignment_res_data_service.flag == 1 || this.upload_assignment.assignment_res_data_service.flag ==2 ){
			        	this.startTimer(this.upload_assignment.assignment_res_data_service.duration,this.upload_assignment.assignment_res_data_service.start); 	
			        }
			        this.UnitStorageUpdate();
				 	loading.dismiss();
				 	this.loading=1;
			 	});
			
		}

		ionViewDidEnter(){
			console.log('I entered');
		}

		startTimer(duration,start){

			this.timer_end=0;
			this.time= parseInt(duration) + parseInt(start) -Math.round(new Date().getTime()/1000);
			this.timerVar=Observable.interval(1000).subscribe( x=>{
				this.timerVal=this.time-x;
                this.days = Math.floor(this.timerVal / 86400);
				this.hours  = Math.floor((this.timerVal % 86400) / 3600);
				this.minutes = Math.floor(((this.timerVal % 86400) % 3600) / 60);
				this.seconds = ((this.timerVal % 86400) % 3600) % 60;

				if(this.timerVal<=0){
					this.timerVar.unsubscribe();
					this.timer_end=1;   // removes form from page  (on time remaining =0)
					if(this.upload_assignment.assignment_res_data_service.flag == 1){
						this.upload_assignment.assignment_res_data_service.message=this.config.get_translation('Timer_expired');
					}
				}
				if(this.timerVal==120){

				    let toast = this.toastCtrl.create({
	                message:this.config.get_translation('You_have_2_minutes_remaining'),
	                duration: 1000,
	                position: 'bottom'
	                });
	                toast.present();
				}

			});
		}

		onSubmit(data){
		
			if(this.file!=undefined && data.value.comment_content!=null ){
					var check_mime_value= this.upload_assignment.assignment_res_data_service.permit_mime.indexOf(this.file.type);
					if(this.file.size<this.upload_assignment.assignment_res_data_service.permit_size && check_mime_value>=0){
				        
				        let loading = this.loadingController.create({
					          content: '<img src="assets/images/bubbles.svg">',
					          duration: 15000,//this.config.get_translation('loadingresults'),
					          spinner:'hide',
					          showBackdrop:true,

					      });
			            loading.present();

					    var datapass={'comment_content':data.value.comment_content,'file':this.file};

						this.upload_assignment.upload_assignment_data(this.assignment_data.id,datapass).subscribe(res=>{ 
							loading.dismiss();
						});	
					}else{
						    let toast = this.toastCtrl.create({
			                message:this.config.get_translation('Not_match_size_or_type'),
			                duration: 2000,
			                position: 'bottom'
			                });
			                toast.present();
					}
			}
			else{
				 
				    let toast = this.toastCtrl.create({
			                message:this.config.get_translation('file_not_selected_comment_not_entered'),
			                duration: 2000,
			                position: 'bottom'
			                });
			                toast.present();
			}
		
		}

		 
		changeListener($event) : void {
		    this.file = $event.target.files[0]; 
		}

		initializeForm()
		{
			this.commentForm = new FormGroup({
	          'assignment': new FormControl(null,Validators.required),
	          'comment_content': new FormControl(null,Validators.required),
	        });
		}

		start_assignment()
		{		
            let loading = this.loadingController.create({
		          content: '<img src="assets/images/bubbles.svg">',
		          duration: 15000,//this.config.get_translation('loadingresults'),
		          spinner:'hide',
		          showBackdrop:true,

		      });
            loading.present();
			this.upload_assignment.start_assignment(this.assignment_data.id).subscribe(res=>{ 
				this.upload_assignment.assignment_res_data_service.flag=1;
				this.timer_end=0;
				this.startTimer(res.duration,res.start);
				this.UnitStorageUpdate();
				loading.dismiss();
				this.loading=1;
			 });
			
		}

        ionViewDidLeave(){
        		this.timerVar.unsubscribe();
        		let assignment_index = this.upload_assignment.assignments.findIndex((assignment)=>{return assignment.id == this.assignment_data.id});
        		this.upload_assignment.assignments[assignment_index].flag=this.upload_assignment.assignment_res_data_service.flag;
        		this.upload_assignment.assignments[assignment_index].started=this.upload_assignment.assignment_res_data_service.start;
        		this.upload_assignment.assignments[assignment_index].status=this.upload_assignment.assignment_res_data_service.marks;
        		this.UnitStorageUpdate();	
        }

        doRefresh(refresher){
        	this.timerVar.unsubscribe();
    	    
    	     let loading = this.loadingController.create({
	          content: '<img src="assets/images/bubbles.svg">',
	          duration: 15000,//this.config.get_translation('loadingresults'),
	          spinner:'hide',
	          showBackdrop:true,

	         });
            loading.present();
	    	
			this.upload_assignment.get_assignment_data(this.assignment_data.id,1).subscribe(res=>{ 

		        if(this.upload_assignment.assignment_res_data_service.flag == 1 || this.upload_assignment.assignment_res_data_service.flag ==2 ){
		        	this.startTimer(this.upload_assignment.assignment_res_data_service.duration,this.upload_assignment.assignment_res_data_service.start); 	
		        }
		        this.UnitStorageUpdate();
				loading.dismiss();
				this.loading=1;
				refresher.complete();
			 });
	    	
	    }
	 // for storage in unit.meta.assignment update when something change in current assignment
	 UnitStorageUpdate(){
		if(this.coursestatus.courseitems[this.current_i] && this.coursestatus.courseitems[this.current_i].meta.assignments){
			let assignment_index = this.coursestatus.courseitems[this.current_i].meta.assignments.findIndex(x => x.id==this.assignment_data.id);
			this.coursestatus.courseitems[this.current_i].meta.assignments[assignment_index] = this.upload_assignment.assignments[assignment_index];
			this.statusservice.updateCourseStatus(this.coursestatus);
			
		}
	 }



}