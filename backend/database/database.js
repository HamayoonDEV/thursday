import mongoose from "mongoose";
import { DATABASE_STRING } from "../config/index.js";

const connectDb = async () => {
  try {
    const con = await mongoose.connect(DATABASE_STRING);
    console.log(`Database is connected to the Host:${con.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
