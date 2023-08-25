class UserDTO {
  constructor(user) {
    this._id = user._id;
    this.userName = user.username;
    this.Name = user.name;
    this.createdAt = user.createdAt;
  }
}

export default UserDTO;
