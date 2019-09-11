export class ChatMessage{
	constructor(
		public sender_user_id: number,
        public sender_user_image:string,
    	public sender_user_displayname: string,
    	public sent_timestamp: string,
        public message_content:string,
		){}
}