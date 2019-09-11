import { Component, OnInit , ViewChild} from '@angular/core';
import { NavController,NavParams,LoadingController, ToastController, Slides,Platform } from 'ionic-angular';
import { ConfigService } from '../../services/config';
import { ChatService } from '../../services/chat';
import { Storage } from '@ionic/storage';
import { ChatMessage } from "../models/chatmessage";
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import firebase from 'firebase';

import { EmojiPickerModule } from 'ionic-emoji-picker';


const debounce = (func, delay)=>{
    let inDebounce
    return function() {
        const context = this
        const args = arguments
        clearTimeout(inDebounce)
        inDebounce = setTimeout(() => func.apply(context, args), delay)
    }
}

@Component({
  selector: 'page-message',
  templateUrl: 'message.html',
})
export class MessagePage implements OnInit{

    navData:any;
    currentKey:any;  // current chat key always initialize
    loadMoreMessagesHandler=1;
    sendMessageObj:any={};
    typing_user={};
    typing_event=[];
    myInput='';
    currentIndex:number=0;
    toggle_search=0;
    toggled: boolean = false;
    messageTabslist:any=[];
    file:any;


    @ViewChild('MessageTabs') messageTabs: Slides;
    @ViewChild('MessageSlides') messageSlides: Slides;
    // @ViewChild('InfiniteScroll') infinite: InfiniteScroll; 
    //@ViewChild(InfiniteScroll) infiniteScroll: InfiniteScroll;
  	constructor(
  		private config:ConfigService,
  		private chatService:ChatService,
  		private toastCtrl:ToastController,
  		private storage:Storage,
        public navCtrl: NavController,
        public loadingCtrl: LoadingController,
        public navParams: NavParams
  		){



  	}

  	ngOnInit(){	
        let $this=this;
        this.messageTabslist=[
        {
        'key':'messages',
        'label':this.config.get_translation('messages'),
        'icon':'ios-chatbubbles'
        },
        {
          'key':'members',
          'label':this.config.get_translation('members'),
          'icon':'md-person-add'
        }
        ];
        this.navData=this.navParams.data; 
        this.currentKey=this.navData.chat_key;
        this.chatService.fetchMyMessages('ngoninit',this.currentKey).then((mychats)=>{  
            if(mychats < this.config.chat.message_number){
                this.loadMoreMessagesHandler = 0;
            }

            
        });
        this.userTyping(this.currentKey);  // user typing event listner       
        this.scrolltoLast();

       setTimeout(function(){
            document.getElementById('slide-zoom_wrapper').addEventListener("scroll", function(event) {
              if(event && event.target){
                  if((<HTMLInputElement>event.target).scrollTop == 0 && $this.loadMoreMessagesHandler){
                        console.log('called');
                        $this.icon_loadMoreMessages();  
                  }
              }
            });
       },300);
  	}

 
    onSlideChanged(){
        this.currentIndex = this.messageSlides.getActiveIndex();
        let index = this.currentIndex;
        if(this.messageTabslist[index]){
           switch(this.messageTabslist[index].key){
            case 'messages':
            break;
            case 'members':
            break;
            default:
            break;
           }
        }
    }


    memberSearchSlide(){
        this.messageSlides.slideTo(1,500);
    }
    backtoChat(){
        this.messageSlides.slideTo(0,500);
    }

    /* Handle emoji selection and append to the messages */
    handleSelection(event) {

        if(!this.sendMessageObj.text_message){
            this.sendMessageObj.text_message='';
        }
        this.sendMessageObj.text_message+=event.char;
    }



    scrolltoLast(){
        setTimeout(function(){
            if(document.getElementById('all_chat_messages_wrapper')){
                let height = document.getElementById('all_chat_messages_wrapper').offsetHeight;
                document.getElementById('slide-zoom_wrapper').scroll(0,height);
            }
        },1000);
    }

    /*ionViewDidLoad(): void {
      // Disable to give time for loading & scrolling
      this.infiniteScroll.enable(false);

      loadFirstTenChats().then(() => {
        // Fiddle with the timing depending on what you are doing.

        // If you have footers or other dynamic content to worry about.
        setTimeout( () => this.content.resize(), 100);

        // Scroll to the bottom once the size has been calculated:
        setTimeout( () => this.content.scrollToBottom(100), 200);

        // The scroll above has to be finished before enabling or
        // else the IS might think it needs to load the next batch.
        setTimeout( () => this.infiniteScroll.enable(true), 1000);
      });
    }*/

  	loadMoreMessages(event:any){  
          this.loadMoreMessagesHandler=0;
          this.chatService.fetchMyMessages('loadMoreMessages',this.currentKey).then((mychats)=>{
               event.complete(); 
                if(mychats > 1){

                    this.loadMoreMessagesHandler=1;
                }
                
          });
     
 	}
    icon_loadMoreMessages(){  
      this.loadMoreMessagesHandler=0;
      this.chatService.fetchMyMessages('loadMoreMessages',this.currentKey).then((mychats)=>{
           
            if(mychats > 1){
                document.getElementById('slide-zoom_wrapper').scroll(0,2);
                this.loadMoreMessagesHandler=1;
            }
            
      });
     
    }

  	doRefresh(refresher){
          this.chatService.fetchMyMessages('doRefresh',this.currentKey).then((mychats)=>{
       	     refresher.complete();
               this.scrolltoLast();
          });
  	}

    changeListener($event) : void {
        this.file = $event.target.files[0];
        if(this.file){
          let toast = this.toastCtrl.create({
                    message: this.config.get_translation('file_selected'),
                    duration: 3000,
                    position: 'bottom'
                });
            toast.present();
        }else{
            let toast = this.toastCtrl.create({
                    message: this.config.get_translation('file_not_selected'),
                    duration: 3000,
                    position: 'bottom'
                });
            toast.present(); 
        }
    }

    attachment_restriction(file){
        if(file.size<=this.config.chat.file_size && (this.config.chat.file_type.indexOf(file.type)>=0) ){
            return true;
        }else{
            return false;
        }
    }

    logForm() {
        if(this.sendMessageObj.text_message){
            if(this.file){
                if(this.attachment_restriction(this.file)){
                    /*check restriction for file upload */
                        let loading = this.loadingCtrl.create({
                                content: '<img src="assets/images/bubbles.svg">',
                                duration: 3000,//this.config.get_translation('loadingresults'),
                                spinner:'hide',
                                showBackdrop:true,
                            });
                        loading.present();
                    this.chatService.uploadChatAttachment(this.file).then((attachment:any)=>{
                        
                          loading.dismiss();
                        this.sendMessageObj.attachment=attachment.url;
                        this.sendMessageObj.attachment_type=attachment.type;
                        this.chatService.sendMessageService(this.sendMessageObj,this.currentKey).then(()=>{
                          
                            this.sendMessageObj={};
                            this.sendMessageObj.text_message='';
                            this.scrolltoLast();
                        });
                    });    
                }else{
                    /* check restiction does not qualified */
                    let toast = this.toastCtrl.create({
                        message: this.config.get_translation('file_not_valid'),
                        duration: 3000,
                        position: 'bottom'
                    });
                    toast.present();
                }
            }
            else{
                this.chatService.sendMessageService(this.sendMessageObj,this.currentKey).then(()=>{
                   
                    this.sendMessageObj={};
                    this.sendMessageObj.text_message='';
                    this.scrolltoLast();
                });
            }
        }else{
            let toast = this.toastCtrl.create({
                message: this.config.get_translation('type_something'),
                duration: 3000,
                position: 'bottom'
            });
            toast.present();
        }
    }

    isTyping(status){
          this.chatService.isTypingService(this.currentKey,status).then(()=>{   
          });

    }
    userTyping(currentKey){
          this.chatService.userTyping(this.currentKey).then((typing_user)=>{
          });
    }


    

    onInput($event){ 
        let $this=this;
        if($this.myInput.length>3){
            $this.chatService.search_user_firebase($this.myInput).then((response)=>{
            });
        }
    }
    onCancel($event){
        this.reset_searched_users();
    }

     /*
        send invitation to user regarding chat
     */         
    add_user_to_chat(user){
        let current_chat_key=this.currentKey;   // set current chat key  // not neccessRY to send current_chat key
        this.chatService.add_user_to_chat(current_chat_key,user).then((response)=>{
            //return => {'notification_key':nk.key}console.log(resolve);
            let toast = this.toastCtrl.create({
                message: this.config.get_translation('notification_send'),
                duration: 3000,
                position: 'bottom'
            });
            toast.present();

        });
        this.reset_searched_users();
    }


    reset_searched_users(){
        this.chatService.searched_users=[];
    }

    toggle_search_bar(){
        if(this.toggle_search==0){
             this.toggle_search=1;
        }else{
             this.toggle_search=0;
        }
        this.reset_searched_users();
        
    }

    getMessageLastTime(message){
            return Math.floor((new Date().getTime() -message.time)/1000);
    }

    exit_from_chat(){
        let $this=this;
        let current_chat_key= $this.currentKey;
        $this.chatService.exit_from_chat(current_chat_key).then((response)=>{
            $this.navCtrl.pop();
        });

    }

  

}
