import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const DATABASE_STRING = process.env.DATABASE_CONNECTION_STRING;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN_STRING;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN_STRING;
export { PORT, DATABASE_STRING, ACCESS_TOKEN, REFRESH_TOKEN };
