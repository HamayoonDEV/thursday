class BlogDetailsDto {
  constructor(blog) {
    this._id = blog._id;
    this.content = blog.content;
    this.photopath = blog.photopath;
    this.createdAt = blog.createdAt;

    if (blog.author) {
      this.author = blog.author._id;
      this.AuthorUserName = blog.author.username;
    } else {
      this.author = null;
      this.AuthorUserName = null;
    }
  }
}
export default BlogDetailsDto;
