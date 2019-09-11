import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions, URLSearchParams } from '@angular/http';
import { Storage } from '@ionic/storage';
import firebase from 'firebase';

@Injectable()
export class ConfigService{  
	
	loading:boolean;
	timestamp:number;
	lastaccess: number; //Last access datetime with website
	fetchedResources:any;
	user:any;
	isLoggedIn:boolean=false;

	homePage:any;

	public baseUrl:string;
	oAuthUrl:string;

	lastCourse:any;
	environment:any;
	settings:any;

	defaultMenu:any;
	per_view:number=10;
	translations: any;
	directoryFilters:any;

	/*
		IMPORTANT DO NOT TOUCH
	*/
	defaultTrack:any;
	track:any;
	trackSync:any;
	contactinfo:any;
	terms_conditions:any;
	unread_notifications_count:number=0;
	wallet:any=[];
	per_page_comment=10;
	chat:any;
	/*== END == */

	constructor(
		private storage:Storage,
		private http:Http)
	{

		this.loading=true;
		this.timestamp =  Math.floor(new Date().getTime() / 1000);
		this.environment ={
			'cacheDuration':86400,
		};

		this.lastaccess = 0;
		this.storage.get('lastaccess').then(res=>{
			if(res){
				this.lastaccess = res;	
			}			
		});

		this.per_view = 5;
		this.settings ={
			'version':1,
			// 'url':'https://wplms.io/',
			'url':'http://www.brightheads.in/',
			// 'client_id':'9gWLZgmn45Es4cjoAUPopRX',
			'client_id':'pGYSq60NwjkDS23ZsXUZsyB',
			// 'client_id':'btXazxAsJWfQEzCtdFezcKChYlXUwe',
			// 'client_secret':'', //Fetched from API call
			'client_secret':'twUQ3k7126dvW#^3!ONwvJiRZ$xwik5ooqz$acfZ',
			// 'client_secret':'mJZfAzTlwNhHtLPEdKvxGcenJQVkgo',
			'state':'fY0(rMVv', // FETCHED from Site
			'access_token':'', // FETCHED on Login 
			'registration':'app',//'app' or 'site' or false
			'login':'app',//Select from 'app' or 'site' or false
			'facebook':{
				'enable':true, 
				'app_id':491338181212175
			},
			'google':{
				'enable':true,
			},
			'per_view':5,
			'force_mark_all_questions':true,
			'wallet':true,					// <<----------REQUIRES WPLMS version 3.4
			'inappbrowser_purchases':true, // <<----------REQUIRES WPLMS version 3.4
			'rtl':false,
			'units_in_inappbrowser':true,
			'open_units_in_inappbrowser_auto':false,
		};

		// this.baseUrl = this.settings.url+'wp-json/wplms/v1/';
		this.baseUrl = this.settings.url+'wp-json/wplms/v1/';
		this.oAuthUrl = this.settings.url+'wplmsoauth/';

		this.defaultMenu = {
			'home': 'Home',
			'about':'About',
			'courses':'Courses',
			'instructors':'Instructors',
			'contact':'Need Help!'
		};
		
		this.homePage = {
			'featuredCourseSlider':1,
			'categories':1,
			'popular':1,
			'featured':1,
		};

		this.directoryFilters = {
			'categories':1,
			'instructors':1,
			'locations':1,
			'levels':1,
			'free_paid':1,
			'online_offline':0,
			'start_date':0,
		};


		/* WALLET RECHARGE : in APP PRODUCT IDS */
		
		this.wallet = [
			{'product_id':'wplms_r_50','points':50},
			{'product_id':'sample','points':50},
		];

/* Started chat setting */
		this.chat={
			'enable_chat':true,   // enable or disable chat  set 'true' for enable and 'false' for disable
			'chat_number':10,   // get pagination for chats
			'message_number':10,	// get pagination for messages
			'chat_agents':[1,2,3,10], // user id of agents for non-logged in user chat
			'welcome_text':'Welcome to BrightHeads App Chat. \
			This Chat is in sync with the website chat.',
			'nonloggedinForm':1,
			'file_size':5242880,   // in byte for upload file
			'file_type':[
				'image/jpeg',
				'image/png',
				'text/plain',
				'text/html',
				'text/csv',
				'video/mp4',
				'application/pdf',
				'application/zip',
				'audio/mpeg',
				'image/bmp'
			]
		};
	/* Initialize firebase here */
		var configfirebase = {
			apiKey: "AIzaSyCe222NR-yPKaZ8or2TL23iNL-JtM6mE1w",
			authDomain: "brightheads.firebaseapp.com",
			databaseURL: "https://brightheads.firebaseio.com",
			projectId: "brightheads",
			storageBucket: "gs://brightheads.appspot.com",
			messagingSenderId: "1066816015640"
		};
		firebase.initializeApp(configfirebase);
		
	/* End of Initialize firebase */
console.log('config firebase initialized finshed');
/* Ended chat settings */

		/* TRACKS LOADED COMPONENTS 
			STATUS : 
				0 NOT LOADED
				1 LOADED
				In array : Loaded
		*/
		this.defaultTrack = {
			'version'				:1,
			'counter'				:0,
			'user'					:0,
			'featured'				:0,// Check if there is any change in featured courses 
			'popular'				:0,// Check if there is any change in popular courses 
			'allcoursecategories'	:0,
			'allcourselocations'	:0,
			'allcourselevels'		:0,
			'allcourses'			:0,
			'allposts'				:0,
			'transactions'			:0,
			'posts'					:[],
			'dashboardCharts'       :[],
			'courses'				:[], // if loaded it exists here
			'stats'  				:0, // Check if any need to reload student statistics
			'notifications'			:0, // Check if any new notifications are added.
			'announcements'			:0, // Check if any new announcements are added for user
			'allinstructors'		:0,//track if new instructor is added in site
			'instructors'			:[], //if loaded it exists here
			'profile'				:0,
			'profiletabs'			:[],//if loaded it exists here
			'reviews'				:[],
			'course_status'			:[], //load course curriclum & statuses
			'statusitems'			:[], 
			'saved_results'			:[],
			'comments'				:[],
			'assignments'			:[]
		};
		this.track = this.defaultTrack;
		this.unread_notifications_count=0;

		this.translations = {
			'home_title':'HOME PAGE',
			'home_subtitle':'Featured Items',
			'start_course': 'Start',
			'search_title':'Searching..',
			'continue_course': 'Continue',
			'completed_course': 'Completed',
			'expired_course': 'Expired',
			'evaluation_course':'Under Evaluation',
			'no_reviews':'No reviews found for this course.',
			'year': 'year',
			'years': 'years',
			'month': 'month',
			'months': 'months',
			'week':'week',
			'weeks':'weeks',
			'day':'day',
			'days':'days',
			'hour':'hour',
			'hours':'hours',
			'minute':'minute',
			'minutes':'minutes',
			'second':'second',
			'seconds':'seconds',
			'expired':'expired',
			'completed':'completed',
			'start_quiz':'Start Quiz',
			'save_quiz':'Save Quiz',
			'submit_quiz':'Submit Quiz',
			'marks': 'Marks',
			'marks_obtained':'Marks obtained',
			'max_marks':'Maximum Marks',
			'true':'TRUE',
			'false':'FALSE',
			'checkanswer':'Check Answer',
			'score':'SCORE',
			'progress': 'PROGRESS',
			'time': 'TIME',
			'filter_options':'FILTER OPTIONS',
			'sort_options':'SORT OPTIONS',
			'popular':'Popular',
			'recent':'Recent',
			'alphabetical':'Alphabetical',
			'rated':'Highest Rated',
			'start_date':'Upcoming',
			'okay':'OKAY',
			'dismiss':'DISMISS',
			'select_category':'Select Category',
			'select_location':'Select Location',
			'select_level':'Select Level',
			'select_instructor':'Select Instructor',
			'free_paid':'Select Course price',
			'price':'Price',
			'apply_filters':'Apply Filters',
			'close':'Close',
			'not_found':'No courses found matching your criteria',
			'no_courses':'No courses !',
			'course_directory_title':'All Courses',
			'course_directory_sub_title':'Course Directory',
			'all':'All',
			'all_free':'Free',
			'all_paid':'Paid',
			'select_online_offline':'Select Course type',
			'online':'Online',
			'offline':'Offline',
			'after_start_date':'Starts after date',
			'before_start_date':'Starts before date',
			'instructors_page_title':'All Instructors',
			'instructors_page_description':'Instructor Directory',
			'no_instructors':'No Instructors found',
			'get_all_course_by_instructor':' View all Courses by Instructor ',
			'profile':'Profile',
			'about':'About',
			'courses':'Courses',
			'marked_answer':'Marked Answer',
			'correct_answer':'Correct Answer',
			'explanation': 'Explanation',
			'awaiting_results':'Awaiting Quiz Results',
			'quiz_results':'Quiz Result',
			'retake_quiz':'Retake Quiz',
			'quiz_start':'Quiz Started',
			'quiz_start_content':'You started quiz',
			'quiz_submit':'Quiz submitted',
			'quiz_submit_content':'You submitted quiz',
			'quiz_evaluate':'Quiz evaluated',
			'quiz_evaluate_content':'Quiz Evaluated',
			'certificate':'Certificate',
			'badge':'Badge',
			'no_notification_found':'No notifications found !',
			'no_activity_found' :' No Activity found !',
			'back_to_course':'Back to Course',
			'review_course':'Review Course',
			'finish_course':'Finish Course',
			'login_heading':'Login',
			'login_title':'Get Started',
			'login_content':'Your courses will be available on all of your devices',
			'login_have_account':'Already have an account',
			'login_signin':'Sign In',
			'login_signup':'Sign Up',
			'login_terms_conditions':'Terms and Conditions',
			'signin_username':'Username or Email',
			'signin_password':'Password',
			'signup_username':'Username',
			'signup_email':'Emails',
			'signup_password':'Password',
			'signup':'Sign Up',
			'login_back':'Back to login',
			'post_review':'Post a review for this course',
			'review_title':'Title for Review',
			'review_rating': 'Rating for this review',
			'review_content': 'Content for Review',
			'submit_review': 'Post Review',
			'rating1star':'Bad Course',
			'rating2star':'Not up to the mark',
			'rating3star':'Satisfactory',
			'rating4star':'Good Course',
			'rating5star':'Excellent',
			'failed':'Failed',
			'user_started_course':'You started a course',
			'user_submitted_quiz':'You submitted the quiz',
			'user_quiz_evaluated':'Quiz evaluated',
			'course_incomplete':'Course Incomplete',
			'finish_this_course':'Please mark all the units of this course',
			'ok':'OK',
			'update_title':'Updates',
			'update_read':'Read',
			'update_unread':'Unread',
			'no_updates':'No updates found',
			'wishlist_title': 'Wishlist',
			'no_wishlist':'No wishlist courses found',
			'no_finished_courses':'No Finished courses!',
			'no_results':'No results found!',
			'loadingresults':'Please wait...',
			'signup_with_email_button_label':'Signup with your email',
			'clear_cache':'Clear Offline data',
			'cache_cleared':'Offline cache cleared',
			'sync_data':'Sync Data',
			'data_synced':'Data Synced',
			'logout':'Logout',
			'loggedout':'You have successfully logged out !',
			'register_account':'Login or Create an account to continue !',
			'email_certificates':'Email certificates',
			'manage_data':'Manage Stored Data',
			'saved_information':'Saved Information',
			'client_id':'Site Key',
			'saved_quiz_results':'Saved Results','timeout':'TimeOut',
			'app_quiz_results':'Results',
			'change_profile_image':'Change Profile image',
			'pick_gallery':'Set image from gallery',
			'take_photo':'Take my photo',
			'cancel':'Cancel',
			'blog_page':'Blog Page',
			'course_chart':'Course Statistics',
			'quiz_chart':'Quiz Statistics',
			'percentage':'Percentage',
			'scores':'Scores',
			'edit':'Edit',
			'change':'Change',
			'edit_profile_field':'Edit Profile Field',
			'pull_to_refresh':'Pull to refresh',
			'refreshing':'...refreshing',
			'contact_page':'Contact',
			'contact_name':'Name',
			'contact_email':'Email',
			'contact_message':'Message',
			'contact_follow_us':'Follow Us',
			'invalid_url':'Invalid url value',
			'read_notifications':'Read notifications',
			'unread_notifications':'Unread Notifications',
			'logout_from_device':'Are you sure you want to logout from this device?',
			'accept_continue':'Accept and Continue',
			'finished':'Finished',
			'active':'Active',
			'open_results_on_site':'Please check results for this quiz in browser.',
			'show_more':'more',
			'show_less':'less',

			'buy':'Buy',
			'pricing_options':'Pricing Options',
			'pricing_options_title':'Pricing Options (swipe to select)',
			'home_menu_title':'Home',
			'directory_menu_title':'Courses & Workshops',
			'instructors_menu_title':'Instructors & Mentors',
			'blog_menu_title':'Blog & Articles',
			'contact_menu_title':'Need Help!',
			'popular_courses_title_home_page':'Popular Courses',
			'popular_courses_subtitle_home_page':'Popular and trending courses',
			'categories_title_home_page':'Categories',
			'categories_subtitle_home_page':'Browse courses via course category',
			'directory_search_placeholder':'Search',
			'featured_courses':'Featured Courses',
			'selected_courses':'Selected courses',
			'markallquestions':'Please mark all questions first.',

			'credit':'Credit',
			'debit':'Debit',
			'wallet_no_products':'Consult Admin to create Wallet Products !',
			'wallet_no_transactions': 'No transactions found !',
			'pay_from_wallet': 'Pay from Wallet',
			'use_wallet':'Use Wallet amount to purchase',
			'pay':'PAY',
			'login_to_buy':'Please Login to Buy this course',
			'login_again':'Please re-login to purchase this course',
			'insufficient_funds':'Insufficient funds in wallet ! Add more funds.',
			'buy_from_site': 'Buy from Site',
			'description':'description',
			'curriculum':'curriculum',
			'reviews':'reviews',
			'instructors':'instructors',
			'retakes_remaining':'Retakes Remaining',
			'open_in_new_window':'Open in New Window',
			'show_notes':'Show Notes & Discussions',
			'unit_attachments': 'Unit Attachments',
			'Adding_new_comment':'Adding new comment',
			'Replying_to_comment':'Replying to',
			'Editing_comment':'Editing Comment',
			'Submit_Comment' :'Submit Comment',
			'Reply_comment' :'Reply',
			'Edit_comment':'Edit',
			'Show_children':'Show Child',
			'Hide_children':'Hide child',
			'Unitcomment':'Unit Comment',
			'No_comment_avail':'No more comments available',
			'Add_comment':'Add comment',
			'Load_comment':'Load comment',
			'Enter_your_comment':'Enter your comment',
			'Cancel':'Cancel',
			'insufficient_content':'Add more text to be saved !',
			'start_assignment':'Start Assignment',
			'upload_assignment':'Upload Assignment',
			'your_attachment':'Your Attachment',
			'your_attachment_comment':'Your Comment',
			'assignment_content':'Assignment Content',
			'all_assignment':'All Assignment',
			'Not_match_size_or_type':'File type or size does not match',
			'Allowed_file_size':'Allowed file size',
			'Allowed_extensions':'Allowed extension type',
			'You_have_2_minutes_remaining': 'You have 2 minutes remaining',
			'file_not_selected_comment_not_entered':'File not selected or comment not entered',
			'Timer_expired':'Timer Expired',
			'start_now': 'Start now',
			'mychats': 'My Chats',
			'members': 'Members',
			'chat':'Chat',
			'start_chat':'Start Chat',
			'start_new_chat':'Start New Chat',
			'chat_message':'Chat Message',
			'chat_email':'Email ID',
			'chat_name':'Name',
			'notification_send':'Notifiaction send',
			'just_now':'Just Now',
			'search_user_from_website':'Search from website',
			'more':'more',
			'is_typing':'is typing',
			'search_user_from_firebase':'Online users',
			'online_user_to_initiate_new_chat':'Start chat from  online users',
			'user_from_site_you_can_not_chat':'You can not chat with site users',
			'chat_initialized':'Chat Initiated',
			'Lenght_greater_than3':'Type more than 3 character',
			'type_here':'Type here to filter users',
			'send_message':'Send',
			'type_message':'Type here',
			'back_to_chat':'Back to messages',
			'file_not_valid':'File not valid upload with other formant or size',
			'type_something':'Type something..',
			'file_selected':'File selected start typing..',
			'file_not_selected':'File not selected start typing..',
			'load_new_messages':'Load more '
		};

		this.contactinfo={
			'title':'Contact Us',
			'message':'We are happy to help you! Kindly share all your queries here or just mail us the same at query@brightheads.in',
			'address':'We understand the importance of talking so you can Call us at 9811061411',
			'email':'query@brightheads.in',
			'phone':'9811061411',
			'twitter':'@brightheadsindia',
			'facebook':'@brightheadsindia',
		};
		// this.terms_conditions = 'These are app terms and conditions. Any user using this app must have\
		// an account on site YouRSite.com. You must not distribute videos in this app to third parties.';
		this.terms_conditions = 'By signing up, you confirm that you have read and agree to our Terms & Conditions and Privacy Policy.';

	}

	get_translation(key:string){
		if(this.translations[key]){
			return this.translations[key];
		}
	}

	trackComponents(key:string){
		return this.track[key];
	}

	updateComponents(key,value){
		if(Array.isArray(this.track[key]) ){
			this.track[key].push(value);
			this.storage.set('track',this.track);
		}else{
			this.track[key]=value;
			this.storage.set('track',this.track);
		}
	}

	//Only for arrays
	removeFromTracker(key,value){
		if(Array.isArray(this.track[key])){
			if(this.track[key].length){
				if(this.track[key].indexOf(value) != -1){
					let k = this.track[key].indexOf(value);
					this.track[key].splice(k,1);
					this.storage.set('track',this.track);
				}
			}
		}
	}
	addToTracker(key,value){
		if(Array.isArray(this.track[key]) ){
			if(this.track[key].indexOf(value) == -1){
				console.log('in add to tracker array');
				this.track[key].push(value);
			}
		}else{
			console.log('in add to tracker single value');
			this.track[key] = value;
		}
		console.log(this.track);
		this.storage.set('track',this.track);
	}

	public set_settings(key,value){
		this.settings[key]=value;
		this.storage.set('settings',this.settings);
	}
	save_settings(){
		this.storage.set('settings',this.settings);
	}

	initialize(){
		this.storage.get('track').then(res=>{
			if(res){
				this.track = res;
			}
			this.getTracker();
		});

		this.storage.get('settings').then(res=>{
			if(res){
				this.settings = res;
			}
		});
		
		this.storage.get('user').then(res=>{
			if(res){
				this.user = res;
				if('id' in this.user){
					this.isLoggedIn = true;
					/* make firebase login from storage */
					this.firebase_login_from_storage(this.user);

					this.getTracker();
				}
			}
		});

		this.storage.get('lastcourse').then((d) => {
            this.lastCourse = d;
        });
	}

	firebase_login_from_storage(user){
    // make firebase hit here to register new user
        if(this.chat.enable_chat){
             this.register_new_user(user);// make login to user or register
        }
    // end of registration
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


	isLoading(){
		return this.storage.get('track');
	}

	updateUser(){
		this.storage.get('user').then(res=>{
			if(res){
				this.user = res;
				if('id' in this.user){
					this.isLoggedIn = true;
				}
			}else{
				this.isLoggedIn = false;
				this.user = 0;
				this.storage.remove('user');
			}
		});
	}
	getLastCourse(){
		this.storage.get('lastcourse').then((d) => {
            this.lastCourse = d;
        });
	}
	matchObj(big:any,small:any){

		for(let i=0;i<big.length;i++){
			if(big[i].time == small.time && big[i].content == small.content){
				return true;
			}
		}
		return false;
	}






	getTracker(){
		
		console.log('FETCH STORED TRACKER');
		console.log(this.track);

		if(this.isLoggedIn){

			console.log('TRACKING ->'+this.isLoggedIn+' = '+this.user.id);
			console.log(this.user);

			this.http.get(`${this.baseUrl}track/`+this.user.id+`?access=`+this.lastaccess)
            .map(response =>{
            	return response.json();
            }).subscribe(res=>{
            	if(res){
            		console.log('Version compare : '+res.version+' == '+this.track.version);
            		if(res.version != this.track.version){
            			//Re-record all cached data.
            			this.defaultTrack.version  = res.version;
            			this.track = this.defaultTrack;
            		}else{
            			
            			var keys = Object.keys(res);
            			console.log('keys');
            			console.log(keys);
            			if(keys.length){
	            			for(let i=0;i<keys.length;i++){
	            				if(keys[i] in this.track){
	            					if(Array.isArray(this.track[keys[i]]) && Array.isArray(res[keys[i]])){
	            						let missing = this.track[keys[i]].filter(item => res[keys[i]].indexOf(item) < 0);
	            						
	            						this.track[keys[i]] = missing;

	            					}else{
	            						if(res[keys[i]] && keys[i] != 'version'){
	            							console.log( keys[i]+ '= '+res[keys[i]]);
	            							if(!isNaN(res[keys[i]]) && res[keys[i]] > 1){
	            								
            									this.track[keys[i]] = res[keys[i]]; //reset recorded set
	            							}else{
	            								
	            								if(Array.isArray(res[keys[i]])){
	            									let sudothis = this;
	            									res[keys[i]].map(function(r,ind){
	            										sudothis.removeFromTracker(keys[i],r);
	            										return r;
	            									});
	            								}else{
	            									console.log('track item set to 0'+'->'+this.track[keys[i]]);
	            									//Ensure Data is not corrupted by Tracker
	            									if(Array.isArray(this.track[keys[i]])){
	            										this.track[keys[i]] = [];
	            										console.log('Array.isArray track item set to 0'+'->'+this.track[keys[i]]);
	            									}else if(typeof res[keys[i]] === 'object'){
	            										let rk = Object.keys(res[keys[i]]);
	            										let sudothis = this;
	            										rk.map(function(r,ind){
		            										sudothis.removeFromTracker(keys[i],r);
		            										return r;
		            									});
	            									}else{
	            										this.track[keys[i]] = 0; //reset recorded set	
	            									}
	            								}
	            							}
	            						}

	            					}
	            				}
	            				if(keys[i] == 'updates'){
	            					this.storage.get('updates').then(storedupdates=>{
	            						if(!storedupdates){storedupdates=[];}
	            						if(res[keys[i]] && res[keys[i]].length){
	            							for(let k=0;k<res[keys[i]].length;k++){
	            								if(!this.matchObj(storedupdates,res[keys[i]][k])){
	            									storedupdates.push(res[keys[i]][k]);
	            								}
		            						}
		            						this.storage.set('updates',storedupdates);

	            						}
	            					});
	            				}
	            			}
	            			console.log(this.track);
	            			this.storage.set('track',this.track);
	            			this.storage.set('lastccess',this.timestamp);
	            			
	            		}

        			}
        			this.storage.get('updates').then(storedupdates=>{	
						if(storedupdates && storedupdates.length){
							this.unread_notifications_count = storedupdates.length;
							this.storage.get('readupdates').then(readupdates=>{
								if(readupdates){
						            this.unread_notifications_count = storedupdates.length-readupdates.length;
						        }
							});
							console.log('unread_notifications_count in config -> '+this.unread_notifications_count);
						}
					});
            	}
            });
		}else{
			console.log('TRACKING');
			
			var url = `${this.baseUrl}track/?access=`+this.lastaccess;

			if(!this.settings.client_secret.length){
				url = `${this.baseUrl}track/?client_id=`+this.settings.client_id+`&access=`+this.lastaccess;
			}


			this.http.get(url)
            .map(response =>{ return response.json();
            }).subscribe(res=>{
            	console.log('GET SITE TRACKER');
            	if(res){
            		if(res.version != this.track.version){
            			//Re-record all cached data.
            			this.defaultTrack.version  = res.version;
            			this.track = this.defaultTrack;

            		}else{

            			if(res.counter != this.track.counter || !res.counter){
	            			var keys = Object.keys(res);
	            			
	            			if(keys.length){
		            			for(let i=0;i<keys.length;i++){
		            				if(keys[i] in this.track){
		            					if(Array.isArray(this.track[keys[i]]) && Array.isArray( res[keys[i]])){
		            						let missing = this.track[keys[i]].filter(item => res[keys[i]].indexOf(item) < 0);
		            						this.track[keys[i]] = missing;
		            					}else{

		            						if(res[keys[i]] && keys[i] != 'version'){
		            							if(!isNaN(res[keys[i]]) && res[keys[i]] > 1){
	            									this.track[keys[i]] = res[keys[i]]; //reset recorded set
		            							}else{
		            								if(Array.isArray(res[keys[i]])){
		            									let sudothis = this;
		            									res[keys[i]].map(function(r,ind){
		            										sudothis.removeFromTracker(keys[i],r);
		            										return r;
		            									});
		            								}else{
		            									console.log('track item set to 0'+'->'+this.track[keys[i]]);
		            									//Ensure Data is not corrupted by Tracker
		            									if(Array.isArray(this.track[keys[i]])){
		            										this.track[keys[i]] = [];
		            										console.log('Array.isArray track item set to 0'+'->'+this.track[keys[i]]);
		            									}else if(typeof res[keys[i]] === 'object'){
		            										let rk = Object.keys(res[keys[i]]);
		            										let sudothis = this;
		            										rk.map(function(r,ind){
			            										sudothis.removeFromTracker(keys[i],r);
			            										return r;
			            									});
		            									}else{
		            										this.track[keys[i]] = 0; //reset recorded set	
		            									}
		            								}
		            							}
		            							
		            						}
		            					}
		            				}
		            				if(keys[i] == 'updates'){
		            					console.log('updates key');
		            					this.storage.get('updates').then(storedupdates=>{
		            						if(!storedupdates){storedupdates=[];}

            								for(let k=0;k<res[keys[i]].length;k++){
	            								if(!this.matchObj(storedupdates,res[keys[i]][k])){
	            									storedupdates.push(res[keys[i]][k]);
	            								}
		            						}
		            						this.storage.set('updates',storedupdates);
		            					});
		            				}
		            			}
		            			this.storage.set('track',this.track);
		            			this.storage.set('lastccess',this.timestamp);
		            		}
		            	}
        			}
            		
            		if('client_secret' in res){
            			console.log('Fetching client_secret');
            			this.settings.client_secret = res.client_secret;
            			this.settings.state = res.state;
            			this.save_settings();
            		}
            		
            		
	            		this.storage.get('updates').then(storedupdates=>{		            			
							if(storedupdates){
								this.unread_notifications_count = storedupdates.length;
								this.storage.get('readupdates').then(readupdates=>{
									if(readupdates){
							            this.unread_notifications_count = storedupdates.length-readupdates.length;
							        }
								});
							}
						});
					
            	}
            });
                    
		}
	}
	isString(val) { return typeof val === 'string'; }
	isArray(obj: any): boolean {return Array.isArray(obj);}
}
