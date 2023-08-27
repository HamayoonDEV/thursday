class BlogDTO {
  constructor(blog) {
    this._id = blog._id;
    this.content = blog.content;
    this.photopath = blog.photopath;
    this.author = blog.author;
    this.createdAt = blog.createdAt;
  }
}
export default BlogDTO;
