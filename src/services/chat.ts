import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions, URLSearchParams } from '@angular/http';
import { Storage } from '@ionic/storage';

import { ConfigService } from "./config";

import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import firebase from 'firebase';



@Injectable()
export class ChatService{ 

	firebase:any;
	myChats:any=[];
	users:any=[];
	last_entry:any;
	removeLoadMore:any;
	current_index=0;
	typing_user={};
	typing_event=[];
	notifications_added_check:any=0;
	child_added_on_chat_key=[];   // if already added then not add again
	searched_users=[];
	child_event_chat_keys=[];  // array of child added on chat keys if already have then not add again

	constructor(
		private http:Http,
		public config:ConfigService,
		public storage:Storage
		)
	{ 	

	}

	fetchUser(user_id){
		return new Promise((resolve)=>{
			this.storage.get('firebase_user_'+user_id).then((user)=>{
				if(user){
					resolve(user);
				}else{
					firebase.database().ref(`/users/${user_id}/base`).once('value',(userSnapshot)=>{
						this.storage.set('firebase_user_'+user_id,userSnapshot.val());
						resolve(userSnapshot.val());
					});	
				}
			});
		});
	}

	
	fetchMyChats(forceRefresh,data){
		let allmyChats=[];
		let $this = this;
		

		return new Promise((res)=>{

			$this.set_current_user().then((current_user_id)=>{
				
				
				if(forceRefresh=='ngoninit' || forceRefresh=='doRefresh'){
					$this.last_entry=0;
				}
				if($this.last_entry){
					firebase.database()
				    .ref(`/users/${current_user_id}/chats`).orderByChild('lastUpdate').endAt($this.last_entry.lastUpdate).limitToLast($this.config.chat.chat_number)
				    .once("value",(snapshot) => {
			    		snapshot.forEach((mychat)=>{
				    		allmyChats.push(new Promise((resolve)=>{

				        		firebase.database()
				    			.ref(`/chats/${mychat.key}/messages`).limitToLast(1)
								.on("child_added",(mychat_snapshot)=>{

									if($this.child_event_chat_keys.indexOf(mychat.key)<0){
										$this.child_event_chat_keys.push(mychat.key);
									}

									let message = mychat_snapshot.val();
									$this.fetchUser(message.user).then((u)=>{

			    						message.user = u;
			    						message.message_key = mychat_snapshot.key;
			    						let data={key:mychat.key,allMessages:[message]};
			    						let t='key_not_exist';   // cheking for key exist or not
			    						if($this.myChats.length){
			    								$this.myChats.map((x,i)=>{
				    								if(x.key==mychat.key){
				    									let check_message_exist='message not found';
				    									$this.myChats[i].allMessages.map((y,j)=>{
				    										if(y.message_key==message.message_key){
				    											check_message_exist='message found';
				    										}
				    									});
				    									if(check_message_exist==='message not found'){
			    											$this.myChats[i].allMessages.unshift(message);
			    											$this.myChats[i].lastUpdate=message.time;
				    									}
				    									t='key_exist';	
				    								}	
			    								});	
			    								if(t=='key_not_exist'){
			    									$this.myChats.push(data);
			    									let index=$this.get_Current_index(data.key);
		    										$this.myChats[index].lastUpdate=message.time;
			    								}	
			    						}
			    						else{
			    							$this.myChats.unshift(data);
			    							let index=$this.get_Current_index(data.key);
		    								$this.myChats[index].lastUpdate=message.time;
			    						}
			    						$this.last_entry=$this.myChats[$this.myChats.length-1];   // end key
			    						resolve('success resolve');
		    						});	
				    			});
				    		}));		    		
			    			Promise.all(allmyChats).then(()=>{
								res($this.myChats);
							});
				    	});
			    	});
					
				}else{

					$this.myChats=[];
					firebase.database()
				    .ref(`/users/${current_user_id}/chats`).orderByChild('lastUpdate').limitToLast($this.config.chat.chat_number)
				    .once("value",(snapshot) => {

			    		snapshot.forEach((mychat)=>{
				    		allmyChats.push(new Promise((resolve)=>{
				    			if($this.myChats.length){
									$this.myChats.map((x,i)=>{
	    								if(x.key==mychat.key){
	    									resolve('key already exist no child added');
	    								}
	    							});
	    						}	

				        		firebase.database()
				    			.ref(`/chats/${mychat.key}/messages`).limitToLast(1)
								.on("child_added",(mychat_snapshot)=>{
									if($this.child_event_chat_keys.indexOf(mychat.key)<0){
										$this.child_event_chat_keys.push(mychat.key);
									}

									let message = mychat_snapshot.val();
									$this.fetchUser(message.user).then((u)=>{

			    						message.user = u;
			    						message.message_key = mychat_snapshot.key;
			    						let data={key:mychat.key,allMessages:[message]};
			    						let t='key_not_exist';   // cheking for key exist or not
			    						if($this.myChats.length){
		    								$this.myChats.map((x,i)=>{
			    								if(x.key==mychat.key){
			    									let check_message_exist='message not found';
			    									$this.myChats[i].allMessages.map((y,j)=>{
			    										if(y.message_key==message.message_key){
			    											check_message_exist='message found';
			    										}
			    									});
			    									if(check_message_exist==='message not found'){
			    											$this.myChats[i].allMessages.unshift(message);
			    											$this.myChats[i].lastUpdate=message.time;
			    										
			    									}
			    									t='key_exist';	
			    								}	
		    								});	
		    								if(t=='key_not_exist'){
		    									$this.myChats.unshift(data);
		    									let index=$this.get_Current_index(data.key);
		    									$this.myChats[index].lastUpdate=message.time;
		    								}	
			    						}
			    						else{
			    							$this.myChats.unshift(data);
			    							let index=$this.get_Current_index(data.key);
		    								$this.myChats[index].lastUpdate=message.time;
			    						}
			    						$this.last_entry=$this.myChats[$this.myChats.length-1];   // end key
			    						resolve('success resolve');
		    						});	
				    			});
				    		}));
					    	Promise.all(allmyChats).then(()=>{
								res($this.myChats);
							});
			    		
				    	});
			    		/* start binding child with lastUpdate of chat */
						firebase.database()
					    .ref(`/users/${current_user_id}/chats`).orderByChild('lastUpdate')
				    	.on("child_changed",(mychat)=>{
			    			let index = this.get_Current_index(mychat.key);
			    			if(index<0){
			    				let data={key:mychat.key,allMessages:[]};
			    				firebase.database()
				    			.ref(`/chats/${mychat.key}/messages`).limitToLast(1)
								.on("child_added",(mychat_snapshot)=>{
									let message = mychat_snapshot.val();
									$this.fetchUser(message.user).then((u)=>{

			    						message.user = u;
			    						message.message_key = mychat_snapshot.key;
			    						let data={key:mychat.key,allMessages:[message]};
			    						let t='key_not_exist';   // cheking for key exist or not
			    						if($this.myChats.length){
		    								$this.myChats.map((x,i)=>{
			    								if(x.key==mychat.key){
			    									let check_message_exist='message not found';
			    									$this.myChats[i].allMessages.map((y,j)=>{
			    										if(y.message_key==message.message_key){
			    											check_message_exist='message found';
			    										}
			    									});
			    									if(check_message_exist==='message not found'){
		    											$this.myChats[i].allMessages.unshift(message);
		    											$this.myChats[i].lastUpdate=message.time;
			    										
			    									}
			    									t='key_exist';	
			    								}	
		    								});	
		    								if(t=='key_not_exist'){
		    									$this.myChats.unshift(data);
		    									$this.myChats[0].lastUpdate=message.time;
		    								}	
			    						}
			    						else{
			    							$this.myChats.unshift(data);
		    								$this.myChats[0].lastUpdate=message.time;
			    						}
			    						$this.last_entry=$this.myChats[$this.myChats.length-1];   // end key
			    						
		    						});	
				    			});
			    			}else{
			    				$this.myChats=$this.array_move($this.myChats,index, 0);
			    				$this.current_index=0;
			    				$this.get_last_update(mychat.key).then((update)=>{
			    					$this.myChats[0].lastUpdate=update;
			    					
			    				})

			    			}		
						});
					/* End of binding lastupdate of chat key */    		
				    });
			    	
				}
			});

		});	
	}

	get_last_update(current_chat_key){
		return new Promise((resolve)=>{
			 firebase.database()
			.ref(`/chats/${current_chat_key}/lastUpdate`)
			.once("value",(snapdata)=>{
				let data=snapdata.val();
				resolve(data);
			});
		})
	}

	/*
		this will movr array element to one position to another 
	*/
	array_move(arr, old_index, new_index) {
	    if (new_index >= arr.length) {
	        var k = new_index - arr.length + 1;
	        while (k--) {
	            arr.push(undefined);
	        }
	    }
	    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
	    return arr; 
	};


	
	/*
		Fetch messages by chat_id and activity(on init, loadmore)
	*/
	fetchMyMessages(activity,current_chat_key){
		let $this = this;
		$this.current_index=this.get_Current_index(current_chat_key);
		//$this.myChats[$this.current_index].unseen=0;// unseen mssage
		let allMessagePromise=[];
		if(activity=='doRefresh' || activity=='ngoninit'){
			$this.myChats[$this.current_index]={key:current_chat_key,allMessages:[]};
		}
		$this.myChats[$this.current_index].unseen=0;
		
		return new Promise((res)=>{
			//Verify if Child Added is connected with this chat.
			$this.child_added_event_handler(current_chat_key).then((ch_response)=>{
				$this.get_all_chat_key_users(current_chat_key).then((users_resolve)=>{ });  // fetch user of chat key 

				if(activity=='doRefresh'|| activity=='ngoninit'){
					//allMessagePromise.push(new Promise(function(resolveAnonymous) {
					    firebase.database()
						.ref(`/chats/${current_chat_key}/messages`).orderByChild('time').limitToLast($this.config.chat.message_number)
						.once("value",(mychat_snapshot)=>{

							// if(mychat_snapshot.val()==null){
							// 	resolveAnonymous();
							// }else{
								Object.keys(mychat_snapshot.val()).forEach(function(key) {
									let message = mychat_snapshot.val()[key];
									allMessagePromise.push(new Promise((resolve)=>{
										$this.fetchUser(message.user).then((u)=>{
											message.user = u;
											message.message_key = key;
											let t='key_not_exist';   // cheking for key exist or not
											if($this.myChats.length){
												if($this.current_index>=0){
													let check_message_exist='message not found';
													$this.myChats[$this.current_index].allMessages.map((eachMessage,eachIndex)=>{
														if($this.myChats[$this.current_index].allMessages[eachIndex].message_key== message.message_key ){
															check_message_exist='messsage found';
														}
													});
													if(check_message_exist=='message not found'){
														$this.myChats[$this.current_index].allMessages.unshift(message);
														let m_len=$this.myChats[$this.current_index].allMessages.length;
														$this.myChats[$this.current_index].lastUpdate=$this.myChats[$this.current_index].allMessages[m_len-1].time;
													}
												}

											}
											//resolveAnonymous();	
											resolve();
										});	
									}));
								});
								Promise.all(allMessagePromise).then(()=>{
									res();
								});
							//}
						});
								
					//}));
			
					
				}
				if(activity=='loadMoreMessages'){
					/*	
						get last index then proceed
					*/
					let message_length=($this.myChats[$this.current_index].allMessages).length;
					let last_message=$this.myChats[$this.current_index].allMessages[message_length-1];

					let message_count = 0;
					allMessagePromise.push(new Promise(function(resolveAnonymous, reject) {
					    firebase.database()
						.ref(`/chats/${current_chat_key}/messages`).orderByChild('time').endAt(last_message.time).limitToLast($this.config.chat.message_number)
						.once("value",(mychat_snapshot)=>{


							if(mychat_snapshot.val()==null){
								resolveAnonymous();
							}else{	
								
								/*
								reverse the keys then proceed firebase gives in reverse order
								*/
								let keys=Object.keys(mychat_snapshot.val());
								message_count = keys.length;
								let reverse_keys=keys.reverse();
								reverse_keys.forEach(function(key) {
									let message = mychat_snapshot.val()[key];
									allMessagePromise.push(new Promise((resolve)=>{
										$this.fetchUser(message.user).then((u)=>{
											message.user = u;
											message.message_key = key;
											let t='key_not_exist';   // cheking for key exist or not
											if($this.myChats.length){
												if($this.current_index>=0){
													let check_message_exist='message not found';
													$this.myChats[$this.current_index].allMessages.map((eachMessage,eachIndex)=>{
														if($this.myChats[$this.current_index].allMessages[eachIndex].message_key== message.message_key ){
															check_message_exist='messsage found';
														}
													});
													if(check_message_exist=='message not found'){
														$this.myChats[$this.current_index].allMessages.push(message);
													}
												}
											}
											resolveAnonymous();	
											resolve();
										});	
									}));
								});
							}
					
						});

					}));
					Promise.all(allMessagePromise).then(()=>{
						res(message_count);
					});
				}
			});	
		});	
	}

	  reverseObject(object) {
        var newObject = {};
        var keys = [];
        for (var key in object) {
            keys.push(key);
        }
        for (var i = keys.length - 1; i >= 0; i--) {
          var value = object[keys[i]];
          newObject[keys[i]]= value;
        }    
        return newObject;
      }

	/*
		get all chat_key users
	*/

	get_all_chat_key_users(current_chat_key){
		let $this = this;
		$this.current_index=this.get_Current_index(current_chat_key);
		let all_user_promise=[];
		$this.myChats[$this.current_index]['chat_users']=[];
		return new Promise((res)=>{
			firebase.database()
			.ref(`/chats/${current_chat_key}/users`)
			.on("value",(mychat_snapshot)=>{
				Object.keys(mychat_snapshot.val()).forEach(function(key) {
					all_user_promise.push(new Promise((resolve)=>{
						$this.fetchUser(key).then((u)=>{
							$this.myChats[$this.current_index]['chat_users'].push(u);
							resolve();
						});
					}));
					Promise.all(all_user_promise).then(()=>{
						res('users set to chat_id');
					});
				});
			});

		});

	}

	/*
		Get current index of any chat_id in my_chats array
	*/
	get_Current_index(current_chat_key){
		let index=-1;
		if(this.myChats.length){
			this.myChats.map((x,i)=>{
				if(x.key==current_chat_key){
					index= i;
				}
			});
		}
		return index;
	}

	/*
		send message to chat_id
	*/
	sendMessageService(messageObj,current_chat_key){
		let $this=this;

		return new Promise((res)=>{
			
			$this.set_current_user().then((current_user_id)=>{
				/* creating sending object*/
				let obj:any=
				{
					time: Date.now(),
					user: current_user_id,
					message:messageObj.text_message
				}
				if(messageObj.attachment && messageObj.attachment_type){
					obj.attachment=messageObj.attachment;
					obj.attachment_type=messageObj.attachment_type;
				}

				firebase.database().ref(`/chats/${current_chat_key}/messages`).push(obj).then(()=>{
					firebase.database().ref(`/users/${current_user_id}/chats/${current_chat_key}/lastUpdate`).set(Date.now()).then(()=>{
						firebase.database().ref(`/chats/${current_chat_key}/lastUpdate`).set(Date.now()).then(()=>{
							res();
						});		
					});
				});	
			});
			
		});

	}

	uploadChatAttachment(file){
		let $this=this;
		return new Promise((resolve)=>{
			// for body form set 
			let body_form_data    = new FormData();
			body_form_data.append('file', file);
			let opt = $this.getUserAuthorizationHeaders();
			$this.http.post(`${$this.config.baseUrl}user/firebase/attachment/`,body_form_data,opt)
	        .map(res => res.json()).subscribe(res=>{
				if(res.status){
					resolve(res.uploaded_data);
				}else{
					resolve(res.uploaded_data);
				}
				
		    });    
		});
	}


	/*
		 set current user as current chat typing 
	*/	 
	isTypingService(current_chat_key,status){
		let $this=this;
		return new Promise((resolve)=>{
			$this.set_current_user().then((current_user_id)=>{
				if(status){
					firebase.database().ref(`/chats/${current_chat_key}/typing`).set(current_user_id).then((snap)=>{
						resolve();
					});
				}else{
					firebase.database().ref(`/chats/${current_chat_key}/typing`).set(0).then((snap)=>{
						resolve();
					});
				}
			});
			
		});
	}

	/*
		add event on chat id
		if already added then not add
	*/
	userTyping(current_chat_key){
		return new Promise((resolve)=>{
			if((this.typing_event.indexOf(current_chat_key)<0)){
				this.typing_event.push(current_chat_key);
				firebase.database()
				.ref(`/chats/${current_chat_key}/typing`)
				.on("value",(snapshot)=>{
					if(snapshot.val()!=0){
						this.fetchUser(snapshot.val()).then((user)=>{
							this.myChats[this.current_index].typing=user;
							resolve(user);
						});
					}
					else{
						this.myChats[this.current_index].typing={};
						resolve({});
					}
				});
			}
			else{
				resolve({});
			}
		});
	}


	/*
		create new user
		create chat
		create notification to all admin
	*/
	addNewChat(new_user_obj){
		let $this=this;
		return new Promise((resolve)=>{
			let user={
					'email':new_user_obj.chat_email,
					'id':'new user',
					'image':'assets/images/chat_user.png',
					'name':new_user_obj.chat_name,
					'status':1,
					'type':'guest'   // here use type of user
				}
			firebase.database().ref(`/users`).push(
				{
					'base':user
					
				}
			).then((value)=>{
				user.id=value.key; //new creted user id

				firebase.database().ref(`/users/${user.id}/`).set(user).then((new_value)=>{
					
					// some onDisconnect operational event 
		        	firebase.database().ref(`/users/${user.id}/status`).onDisconnect().set(0);
		        	firebase.database().ref(`/users/${user.id}/lastActive`).onDisconnect().set(Date.now());
		        	firebase.database().ref(`/users/${user.id}/base/status`).onDisconnect().set(0);
		        	firebase.database().ref(`/users/${user.id}/base/lastActive`).onDisconnect().set(Date.now());

		        	//set base->id=new created user id and new chat assign
					firebase.database().ref(`/users/${user.id}/base/`).set(user).then((new_value)=>{
						let args={
							'type':'presale',
							'primary_id':'0'
						};

						// this will create  new chat for new user
						$this.new_chat(args,user,new_user_obj).then((rvalue:any)=>{
							
							if(rvalue.hasOwnProperty('chat_key') && rvalue.chat_key){
								firebase.database().ref(`/users/${user.id}/chats/${rvalue.chat_key}`).set({
									'lastUpdate':Date.now(),
									'primary_id':'primary_id_define',
									'time':Date.now(),
									'type':'presale'
								}).then((v)=>{
									// now push presale/personal (any)  chats push
									firebase.database().ref(`/${args.type}/chats/`).push({
										'key':rvalue.chat_key,
										'time':Date.now(),
										'user':user.id,
										'type':'presale'
									}).then((pres)=>{
										// now make notification
										let noti_obj={
											'chat_id':rvalue.chat_key,
											'sender':user.id,
											'type':'chat_invite',
											'status':0
										};
										let notified_admin_ids=$this.config.chat.chat_agents;
										// for all admin will be notified
										if(notified_admin_ids.length){
											let notification_all_users_p=[]; // for all promise check if every admin notified or not.
											
											notified_admin_ids.map((admin_id,i)=>{
													notification_all_users_p.push($this.create_new_notification(noti_obj,admin_id).then((nk_obj)=>{
														
													}));
											});
											Promise.all(notification_all_users_p).then((values)=>{
												//console.log('resolved with notification, presale/general ,new user,chat push , new message');
												resolve({'chat_key':rvalue.chat_key,'user':user});
											});
										}
									});
										
								});
							}
							
						});
					});

				});

			});    
		});
	}

	/*
		non logged in
		create new chat id in chat table
		push first message in chat_id
	*/
	new_chat(args,user,new_user_obj){
		return new Promise((resolve)=>{
			firebase.database().ref(`/chats`).push({
				time:  Date.now(),
				lastUpdate:Date.now(),
				author: user.id,
				primary_id:args.primary_id,
				type:args.type,
				typing:0,
				users:{
					[user.id]:Date.now(),
				},
				messages:''
			}).then((ck)=>{
				firebase.database().ref(`/chats/${ck.key}/messages`).push({
					'message':new_user_obj.chat_message,
					'time':Date.now(),
					'user':user.id
				}).then((mk)=>{
					resolve({'chat_key':ck.key,'message_key':mk.key});
				});	
				
			});

		});
	}

	/*
		Logged in user: start new chat then invite users
		non logged_in user will make notification to agent with chat id and invitatio
	*/
	start_new_chat(user,args){
		let $this=this;
		return new Promise((resolve)=>{
			let time=Date.now();
			firebase.database().ref(`/chats`).push({
				'time': Date.now(),
				'lastUpdate':Date.now(),
				'author': user.id,
				'primary_id':args.primary_id,
				'type':args.type,
				'typing':0,
				'users':{
					[user.id]:Date.now(),
				},
				messages:''
			}).then((chat_key)=>{
				//console.log('Here is our new chat_key:'+chat_key);
				firebase.database().ref(`/users/${user.id}/chats/${chat_key.key}`).set({
					'lastUpdate':Date.now(),
					'primary_id':args.primary_id,
					'time':Date.now(),
					'type':args.type
				}).then((result)=>{

					/* now make notification if user nonLoggedIn */
					if(!$this.config.isLoggedIn){
						let noti_obj={
							'chat_id':chat_key.key,
							'sender':user.id,
							'type':'chat_invite',
							'status':0
						};
						let notified_admin_ids=$this.config.chat.chat_agents;
						notified_admin_ids.map((admin_id,i)=>{
							$this.create_new_notification(noti_obj,admin_id).then((nk_obj)=>{
							
							});
						});	
					}
					/* End of making notification to admin/agents  */
					//console.log('chat_key');
					resolve(chat_key);	
				});
			});
		});
	}


	start_new_chat_with_member(user,args,member_id){
		let $this=this;
		return new Promise((resolve)=>{
			let time=Date.now();
			firebase.database().ref(`/chats`).push({
				'time': Date.now(),
				'lastUpdate':Date.now(),
				'author': user.id,
				'primary_id':args.primary_id,
				'type':args.type,
				'typing':0,
				'users':{
					[user.id]:Date.now(),
					[member_id]:Date.now()
				},
				messages:''
			}).then((chat_key)=>{
				// console.log('chat_key');
				firebase.database().ref(`/users/${user.id}/chats/${chat_key.key}`).set({
					'lastUpdate':Date.now(),
					'primary_id':args.primary_id,
					'time':Date.now(),
					'type':args.type
				}).then((result)=>{
					firebase.database().ref(`/users/${member_id}/chats/${chat_key.key}`).set({
					'lastUpdate':Date.now(),
					'primary_id':args.primary_id,
					'time':Date.now(),
					'type':args.type
					}).then((result)=>{
						// console.log('result');
						resolve(chat_key);	
					});
				});
			});
		});
	}

	/*
		create notification to admin_id notification table
	*/

	create_new_notification(noti_obj,admin_id){
		return new Promise((resolve)=>{
			firebase.database().ref(`/notifications/${admin_id}/`).push({
				'chat_id':noti_obj.chat_id,
				'sender':noti_obj.sender,
				'status':0,
				'time':Date.now(),
				'type':noti_obj.type
			}).then((nk)=>{
				//console.log('create_new_notification');
				resolve({'notification_key':nk.key});
			});
			
		});
	}

	/*
		set current user if user logged 
		or  non logged(in case of user present in storage)
		+ return user object
	*/
	set_current_user(){
		return new Promise((resolve)=>{
			let current_user_id=0; // set here user for both case:{logged_in} and {non logged_in}
			// resolve(current_user_id);
			if(this.config.isLoggedIn){
				current_user_id=this.config.user.id;
				resolve(current_user_id);
			}else{
				this.storage.get('non_logged_in').then((result)=>{
				 	if(result){
					 current_user_id=result.user.id;
					 this.config.user=result.user;
					 resolve(current_user_id);
				 	}
				 });
			}
		});
	}

	/*
	check if child_added on chat_key 
		if yes resolve()
		if not then add child_added 	
	*/
	child_added_event_handler(current_chat_key){
		
		let $this = this;
		return new Promise((res)=>{

			if($this.child_event_chat_keys.indexOf(current_chat_key)>=0){
				
				res('child event already added');

			}else{
				$this.child_event_chat_keys.push(current_chat_key);

				$this.current_index=this.get_Current_index(current_chat_key);  // get current index of chat_id in mychat array

			    firebase.database()
				.ref(`/chats/${current_chat_key}/messages`).limitToLast(1)
				.on("child_added",(mychat_snapshot)=>{
					let message = mychat_snapshot.val();
					$this.fetchUser(message.user).then((u)=>{
						message.user = u;
						message.message_key = mychat_snapshot.key;
						let data={key:current_chat_key,allMessages:[message]};
						let t='key_not_exist';   // cheking for key exist or not
						if($this.myChats.length){

								$this.myChats.map((x,i)=>{
									if(x.key==current_chat_key){
										let check_message_exist='message not found';
										$this.myChats[i].allMessages.map((y,j)=>{
											if(y.message_key==message.message_key){
												check_message_exist='message found';
											}
										});
										if(check_message_exist==='message not found'){
											$this.myChats[i].allMessages.unshift(message);
											$this.myChats[i].lastUpdate=message.time;
										}
										t='key_exist';	
									}	
								});	
								if(t=='key_not_exist'){
									$this.myChats.unshift(data);
									$this.myChats[0].lastUpdate=message.time;
								}	
						}
						else{
							$this.myChats.unshift(data);
							$this.myChats[0].lastUpdate=message.time;
						}
						//console.log($this.myChats);
						$this.last_entry=$this.myChats[$this.myChats.length-1];   // end key
						res('added child_event');
					});	
				});
			}

			

		});

	}

	/*
		create new user with given object
		without checking if user exist or not
	*/
	create_new_user(new_user_obj){
		return new Promise((resolve)=>{
			let user={
					'email':new_user_obj.chat_email,
					'id':'new_user_obj.id',
					'image':'assets/images/chat_user.png',
					'name':new_user_obj.chat_name,
					'status':new_user_obj.status
				}
			firebase.database().ref(`/users`).push(
				{
					'base':user
					
				}
			).then((value)=>{
				user.id=value.key; //new creted user id

				// some onDisconnect operational event 
	        	firebase.database().ref(`/users/${user.id}/status`).onDisconnect().set(0);
	        	firebase.database().ref(`/users/${user.id}/lastActive`).onDisconnect().set(Date.now());
	        	firebase.database().ref(`/users/${user.id}/base/status`).onDisconnect().set(0);
	        	firebase.database().ref(`/users/${user.id}/base/lastActive`).onDisconnect().set(Date.now());

	        	//set base->id=new created user id and new chat assign
				firebase.database().ref(`/users/${user.id}/base/`).set(user).then((new_value)=>{
						resolve('new user pushed');		
				});	
			});	

		});	
	}



	/*
		get all active user from firebase and send notification regarding chat key
	*/
	add_user_to_chat(current_chat_key,user){
		let $this=this;
		return  new Promise((res)=>{
				let noti_obj={
					'chat_id':current_chat_key,
					'sender':$this.config.user.id,
					'type':'chat_invite'
				}
				$this.create_new_notification(noti_obj,user.id).then((resolve)=>{
					//return => {'notification_key':nk.key}console.log(resolve);
					res(resolve);
				});
		});

	}


	search_user_firebase(user_initials){
		let $this=this;
		
		return new Promise((res)=>{



			firebase.database()
			.ref(`/users/`).orderByChild('name')
			.startAt(`${user_initials}`).endAt(`${user_initials}`+`\uf8ff`)
			.once('value',function(snapdata){
				if(snapdata.val()==null){
					$this.searched_users=[];
					res($this.searched_users);
				}else{
					let all_response=snapdata.val();
					let user_ids=[];
					user_ids=Object.keys(snapdata.val());
					let return_users=[];
					user_ids.map((key,i)=>{
						if(all_response[key].status){
							return_users.push(all_response[key])
						}	
					});
					$this.searched_users=return_users;
					res($this.searched_users);
				}
			});
		});
	}

	/*
		Search online members from firebase
	*/
	search_online_members(){
		let $this=this
		let online_users=[];
		return new Promise((res)=>{
			firebase.database()
			.ref(`/users/`).orderByChild('status').equalTo(1)
			.once('value',function(snapdata){
				if(snapdata.val()==null){
					res(online_users);
				}else{
					let all_response=snapdata.val();
					let user_ids=[];
					user_ids=Object.keys(snapdata.val());
					user_ids.map((key,i)=>{
						if(all_response[key]!=null){
							online_users.push(all_response[key])
						}	
					});
					res(online_users);
				}
			});
		});
	}

	register_new_user(new_user_obj){
		let $this=this;
		let type='student';  // get type here admin or  student

		firebase.database()
		.ref(`/users/${new_user_obj.id}`)
		.once('value',function(snapdata){
			if(snapdata.val()==null){
					let user={
						'email':new_user_obj.email,
						'id':new_user_obj.id,
						'image':new_user_obj.avatar,
						'name':new_user_obj.name,
						'status':1
					}

				firebase.database().ref(`/users/${new_user_obj.id}/id`).set(new_user_obj.id);
				firebase.database().ref(`/users/${new_user_obj.id}/image`).set(new_user_obj.avatar);
				firebase.database().ref(`/users/${new_user_obj.id}/name`).set(new_user_obj.name);
				firebase.database().ref(`/users/${new_user_obj.id}/status`).set(1);
				firebase.database().ref(`/users/${new_user_obj.id}/type`).set(type);



				firebase.database().ref(`/users/${new_user_obj.id}/base`).set(user)
				.then((value)=>{
					user.id=value.key; //new creted user id

					// some onDisconnect operational event 
		        	firebase.database().ref(`/users/${user.id}/status`).onDisconnect().set(0);
		        	firebase.database().ref(`/users/${user.id}/lastActive`).onDisconnect().set(Date.now());
		        	firebase.database().ref(`/users/${user.id}/base/status`).onDisconnect().set(0);
		        	firebase.database().ref(`/users/${user.id}/base/lastActive`).onDisconnect().set(Date.now());

		        	//set base->id=new created user id and new chat assign
					firebase.database().ref(`/users/${user.id}/base/`).set(user).then((new_value)=>{
							console.log('new user registered');
					});	
				});	
			}else{
				/*set status of user 1 if user logged_in int App also make 
					user status 0 if user not disconnect
				*/
				// $this.config.user.id
				firebase.database().ref(`/users/${new_user_obj.id}/status`).set(1);
				firebase.database().ref(`/users/${new_user_obj.id}/status`).onDisconnect().set(0);
	        	firebase.database().ref(`/users/${new_user_obj.id}/lastActive`).onDisconnect().set(Date.now());
	        	firebase.database().ref(`/users/${new_user_obj.id}/base/status`).onDisconnect().set(0);
	        	firebase.database().ref(`/users/${new_user_obj.id}/base/lastActive`).onDisconnect().set(Date.now());
			}
		});
	}

	public getUserAuthorizationHeaders(){
        var userheaders = new Headers();
        userheaders.append('Authorization', this.config.settings.access_token);
        return new RequestOptions({ headers: userheaders }); 
    }

	search_user_from_directory(user_initials){
		let $this=this;
		let opt = this.getUserAuthorizationHeaders();
		return new Promise((resolve)=>{
			$this.http.post(`${this.config.baseUrl}user/alluser`,{'user_initials':user_initials},opt).map(res => res.json()).subscribe(res=>{
				if(res.status){
					resolve(res);
				}else{
					resolve(res);
				}
				
		    });    
		});
		
	}	

	exit_from_chat(current_chat_key){
		let $this=this;
		return new Promise((res)=>{
			let current_user_id=$this.config.user.id;
			let index=$this.get_Current_index(current_chat_key);
			$this.myChats.splice(index, 1);  // Element removed
			firebase.database().ref(`/chats/${current_chat_key}/users`).off();
		    firebase.database().ref(`/chats/${current_chat_key}/messages`).off();
			firebase.database().ref(`/users/${current_user_id}/chats/`).child(current_chat_key).remove();
			//firebase.database().ref(`/chats/${args.chat_id}/users/`).child(args.user.id).remove();
			res('exit')
		});

	}


}



