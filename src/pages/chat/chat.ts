import { Component, OnInit , ViewChild} from '@angular/core';

import { NavController,NavParams,LoadingController, ToastController, Slides,Platform } from 'ionic-angular';

import { ConfigService } from '../../services/config';
import { ChatService } from '../../services/chat';

import { Storage } from '@ionic/storage';
import { ChatMessage } from "../models/chatmessage";

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import firebase from 'firebase';
import {MessagePage} from '../message/message';
import { FormGroup,FormControl, Validators ,FormBuilder} from '@angular/forms';

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage implements OnInit{

	contact:FormGroup;  

	chatTabslist:any=[];
	myChatsVal:any=[];
	messagePage=MessagePage;
	removeLoadMore=1;	/* load more toggle untill DATA WILL NOT GET */
	to_search_user='';
	all_searched_users:any;
	backup_all_searched_users:any;
	send_chat_obj={};
	non_logged_in_exist=0;    // for non logged in form toggle
	from_firebase=1;  /*toggle search member firebase and local users */

	@ViewChild('ChatTabs') chatTabs: Slides;
	@ViewChild('ChatSlides') chatSlides: Slides;
	constructor(
		private config:ConfigService,
		private chatService:ChatService,
		private toastCtrl:ToastController,
		private storage:Storage,
		public navCtrl: NavController,
		public navParams: NavParams,
		public loadingCtrl: LoadingController,
		private formBuilder: FormBuilder,
		){

		this.contact = formBuilder.group({
	        	chat_name: [''],
	        	chat_email: new FormControl('', Validators.compose([
								Validators.required,
								Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
							])),
	        	chat_message: [''],
		});

		this.chatTabslist=[
		{
		'key':'mychats',
		'label':this.config.get_translation('mychats'),
		'icon':'ios-chatbubbles'
		},
		{
		  'key':'members',
		  'label':this.config.get_translation('members'),
		  'icon':'md-person-add'
		}
		];
	}

	/*
	new FormControl('', Validators.compose([
		Validators.required,
		Validators.maxLength(25),
		Validators.minLength(5),
		Validators.pattern('^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$')
	])),
	*/

	ngOnInit(){
		let loading = this.loadingCtrl.create({
	            content: '<img src="assets/images/bubbles.svg">',
	            duration: 3000,//this.config.get_translation('loadingresults'),
	            spinner:'hide',
	            showBackdrop:true,
	        });
	    loading.present();

		if(this.config.isLoggedIn){
			this.chatService.fetchMyChats('ngoninit',{}).then((mychats)=>{
			 	loading.dismiss();
			});
		}else{
			this.non_logged_in_exist=0;
			this.chatService.fetchMyChats('ngoninit',{}).then((mychats)=>{
				this.non_logged_in_exist=1;
			 	loading.dismiss();
			});
		
		}
	}
	selectedTab(index:number){
		this.chatSlides.slideTo(index, 500);
	}

	onSlideChanged(){
	   let index = this.chatSlides.getActiveIndex();
	   this.chatTabs.slideTo(index,500);
	   if(this.chatTabslist[index]){
		   switch(this.chatTabslist[index].key){
			case 'mychats':
			 // console.log('mychats');
			break;
			case 'chat':
			 //console.log('chat');
			break;
			case 'members':
			 this.online_users();
			// console.log('members');
			break;
			default:
			  //console.log('default');
			break;
		   }
	   }
	}

	onTabChanged(){
		let index = this.chatTabs.getActiveIndex();
	    this.chatSlides.slideTo(index,500);
	}

	loadMoreChats(event:any){  
		this.chatService.removeLoadMore=0;
		this.chatService.fetchMyChats('loadmorechats',{}).then((mychats)=>{
			this.chatService.removeLoadMore=1;
			event.complete();
		});     
	  }

	
	doRefresh(refresher){
		refresher.complete();
		this.chatService.fetchMyChats('doRefresh',{}).then((mychats)=>{
		});
	}
	

	goToNextPage(chat){
		this.navCtrl.push(this.messagePage,{'chat_key':chat.key});
	}
	online_users(){
		this.from_firebase=1; 
		let loading = this.loadingCtrl.create({
			content: '<img src="assets/images/bubbles.svg">',
			duration: 15000,//this.config.get_translation('loadingresults'),
			spinner:'hide',
			showBackdrop:true,

		});
		loading.present();
		//make api hit to search users
		this.chatService.search_online_members().then((all_users)=>{
			this.all_searched_users=all_users;
			this.backup_all_searched_users=all_users;
			 loading.dismiss();
		});
	}

	doRefresh_members(refresher){
		this.from_firebase=1; 
		refresher.complete();
		let loading = this.loadingCtrl.create({
		content: '<img src="assets/images/bubbles.svg">',
		duration: 15000,//this.config.get_translation('loadingresults'),
		spinner:'hide',
		showBackdrop:true,

		});
		loading.present();
		//make api hit to search users
		this.chatService.search_online_members().then((all_users)=>{
			loading.dismiss();
			this.all_searched_users=all_users;
			this.backup_all_searched_users=all_users;
		});
	}


	/* Data format of log form 
	      let user={
          	'email':'testEmail',
          	'image':'assets/images/chat_user.png',
          	'id':1,
          	'name':'testName',
          };
          let data={'chat_key':'-LdbpRnIJ_X25U9oYGUx','user':user};
          this.storage.set('non_logged_in',data);
          this.navCtrl.push(this.messagePage,data);
    */      
	logForm(){
			let loading = this.loadingCtrl.create({
	        content: '<img src="assets/images/bubbles.svg">',
	        duration: 5000,
	        spinner:'hide',
	        showBackdrop:true,
	        });
		    loading.present();
      	this.chatService.addNewChat(this.contact.value).then((data)=>{
      		this.non_logged_in_exist=1;  // message form toggle
      		loading.dismiss();
			let toast = this.toastCtrl.create({
			message:this.config.get_translation('chat_initiated'),
			duration: 3000,
			position: 'bottom'
			});
           	toast.present();
			/* data= {chat_key:xyz,user:{}}   'data' format*/   
			this.storage.set('non_logged_in',data);
			this.chatService.set_current_user().then((current_user_id)=>{

			});
           	this.navCtrl.push(this.messagePage,data);
		});    
	}

	/*
	sortMyChats(chats){
		return chats.sort((a,b)=>{ return a.lastUpdate - b.lastUpdate});
	}
	*/
	start_new_chat(){
		let loading = this.loadingCtrl.create({
        content: '<img src="assets/images/bubbles.svg">',
        duration: 5000,
        spinner:'hide',
        showBackdrop:true,
        });
	    loading.present();
		//get user info then proceed to create new chat for user
		this.chatService.set_current_user().then((current_user_id)=>{
			let user=this.config.user;
				let args={
						'type':'general',
						'primary_id':'0'
					};
			this.chatService.start_new_chat(user,args).then((response:any)=>{
				loading.dismiss();
					let data={
						'chat_key':response.key,
						'user':user
					}
					this.navCtrl.push(this.messagePage,data);	
			});
		});
	}

	start_new_chat_with_members(member){
		let member_id=member.id;  // initialized member id to start chat

		let loading = this.loadingCtrl.create({
        content: '<img src="assets/images/bubbles.svg">',
        duration: 5000,//this.config.get_translation('loadingresults'),
        spinner:'hide',
        showBackdrop:true,
        });
	    loading.present();

		let user=this.config.user;
		let args={
				'type':'general',
				'primary_id':'0'
			};
		this.chatService.start_new_chat_with_member(user,args,member_id).then((response:any)=>{
			loading.dismiss();
			let data={
				'chat_key':response.key,
				'user':user
			}
			this.navCtrl.push(this.messagePage,data);
		});
	}

	// getChatLastTime(time){
	// 	return Math.floor((new Date().getTime() - time)/1000);
	// }

	/* filter firebase online user*/
	user_search(args){
		let $this=this;
		let result=$this.all_searched_users.filter(user => user.name.search($this.to_search_user)>=0?1:0
			);
			$this.backup_all_searched_users=result;
		
	}
	search_user_from_directory(){
		let $this=this;
		this.from_firebase=0;

		let loading = this.loadingCtrl.create({
        content: '<img src="assets/images/bubbles.svg">',
        duration: 5000,//this.config.get_translation('loadingresults'),
        spinner:'hide',
        showBackdrop:true,
        });
	    loading.present();

	    /*make api hit  when initials length > 3*/
	    if($this.to_search_user.length>3){
			$this.chatService.search_user_from_directory($this.to_search_user).then((result)=>{
				loading.dismiss();
				$this.backup_all_searched_users=result['users'];
			});
	    }
	    else{
	    	/* dismiss loading and make a toast controller */
	    	let toast = this.toastCtrl.create({
			message: this.config.get_translation('Lenght_greater_than3'),
			duration: 3000,
			position: 'bottom'
			});
           	toast.present();
           	loading.dismiss();
	    }

	}
	
}


			

		