export class Player
{
	id:				string;
	socketId:		string;
	username:		string;
	profilepicture:	string;
	playerscore:	number;

	constructor(id: string, socketId: string, username: string,
	profilepicture: string, playerscore: number)
	{
		this.id = id;
		this.socketId = socketId;
		this.username = username;
		this.profilepicture = profilepicture;
		this.playerscore = playerscore;
	}

}
