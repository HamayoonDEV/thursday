import Joi from "joi";
import Comment from "../models/comments.js";
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const commentController = {
  //createComment
  async createComment(req, res, next) {
    //validate use input
    const commentCreateSchema = Joi.object({
      content: Joi.string().required(),
      author: Joi.string().regex(mongoIdPattern).required(),
      blog: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = commentCreateSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { content, author, blog } = req.body;
    let comment;
    try {
      const newComment = new Comment({
        content,
        author,
        blog,
      });
      comment = await newComment.save();
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(201).json({ comment });
  },
  //getComments by blog i
  async getAll(req, res, next) {
    const commentIdSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = commentIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }

    const { id } = req.params;

    try {
      const comments = await Comment.find({});
      const commentArray = [];
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        commentArray.push(comment);
      }
      return res.status(200).json({ comments: commentArray });
    } catch (error) {
      return next(error);
    }
  },
};

export default commentController;
