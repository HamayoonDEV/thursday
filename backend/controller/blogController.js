import Joi from "joi";
import fs from "fs";
import Blog from "../models/blog.js";
import { BACKEND_SEVER_PATH } from "../config/index.js";
import BlogDTO from "../DTO/blogDto.js";
import BlogDetailsDto from "../DTO/blog-details.js";
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const blogController = {
  //create blog method
  async createBlog(req, res, next) {
    //validate user input
    const blogCreateSchema = Joi.object({
      content: Joi.string().required(),
      title: Joi.string().required(),
      photopath: Joi.string().required(),
      author: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = blogCreateSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { content, title, photopath, author } = req.body;

    //read photo in buffer
    const buffer = Buffer.from(
      photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );
    //allocate random name
    const imagePath = `${Date.now()}-${author}.png`;
    //store locally
    try {
      fs.writeFileSync(`storage/${imagePath}`, buffer);
    } catch (error) {
      return next(error);
    }
    //save to database
    let blog;
    try {
      const blogTosave = new Blog({
        content,
        title,
        author,
        photopath: `${BACKEND_SEVER_PATH}/storage/${imagePath}`,
      });
      blog = await blogTosave.save();
    } catch (error) {
      return next(error);
    }
    //DTO
    const blogDto = new BlogDTO(blog);

    //sending respone
    res.status(200).json({ blog: blogDto });
  },

  //get all blogs method
  async getAll(req, res, next) {
    try {
      const blogs = await Blog.find({}).populate("author");
      const blogDTO = [];
      for (let i = 0; i < blogs.length; i++) {
        const dto = new BlogDetailsDto(blogs[i]);
        blogDTO.push(dto);
      }
      //sending response
      return res.status(200).json({ blogs: blogDTO });
    } catch (error) {
      return next(error);
    }
  },
  //get blog by id
  async getBlogById(req, res, next) {
    const getBlogByIdSchema = Joi.object({
      id: Joi.string().required(),
    });
    const { error } = getBlogByIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    let blog;
    try {
      blog = await Blog.findOne({ _id: id });
    } catch (error) {
      return next(error);
    }
    //Dto
    const blogdto = new BlogDetailsDto(blog);
    //sending response
    res.status(200).json({ blog: blogdto });
  },
  //update blog
  async updateBlog(req, res, next) {
    //validate user input
    const updateBLogSchema = Joi.object({
      content: Joi.string(),
      title: Joi.string(),
      author: Joi.string().regex(mongoIdPattern).required(),
      blogId: Joi.string().regex(mongoIdPattern).required(),
      photopath: Joi.string(),
    });
    const { error } = updateBLogSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { content, title, author, blogId, photopath } = req.body;
    let blog;
    try {
      blog = await Blog.findOne({ _id: blogId });
    } catch (error) {
      return next(error);
    }
    //delete previous photo
    try {
      if (photopath) {
        let previous = blog.photopath;
        previous = previous.split("/").at(-1);
        fs.unlinkSync(`storage/${previous}`);

        //updating new photo
        //read photo in buffer
        const buffer = Buffer.from(
          photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
          "base64"
        );
        //allocate random name
        const imagePath = `${Date.now()}-${author}.png`;
        //store locally
        try {
          fs.writeFileSync(`storage/${imagePath}`, buffer);
        } catch (error) {
          return next(error);
        }
        //updating to database
        try {
          await Blog.updateOne({
            content,
            title,
            photopath: `${BACKEND_SEVER_PATH}/storage/${imagePath}`,
          });
        } catch (error) {
          return next(error);
        }
      } else {
        await Blog.updateOne({ content, title });
      }
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "blog has been updated!!!" });
  },
  //delete blog
  async delete(req, res, next) {
    const delelteBLogSChema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = delelteBLogSChema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id, blogId } = req.params;
    try {
      await Blog.deleteOne({ _id: id });
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "blog has been deleted!!!" });
  },
};

export default blogController;
