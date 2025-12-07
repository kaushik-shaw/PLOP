import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import dataRouter from "./routes/dataRoutes.js"
import paramRouter from "./routes/paramRoute.js";

const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedorigins = ['http://localhost:5173'];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: allowedorigins,
  credentials: true
}));

app.use("/", dataRouter);
app.use("/api", paramRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
