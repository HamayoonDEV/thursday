import mongoose from "mongoose";

const { Schema } = mongoose;
const BlogSchema = new Schema(
  {
    content: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    photopath: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Blog", BlogSchema, "blogs");
