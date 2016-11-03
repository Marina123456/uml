'use strinct';
class User {
	constructor(firstName,lastName,eMail,telephone,birthday,password){
		this.firstName=firstName;
		this.lastName=lastName;
		this.eMail=eMail;
		this.telephone=telephone;
		this.birthday=birthday;
		this.password=password;
	}
}
class Admin extends User {
	constructor(level){
		super();
		this.level=level;
	}
}
class Department {
	constructor(name){
		this.name=name;
	}
}
