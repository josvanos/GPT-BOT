import dotenv from "dotenv";
dotenv.config();
import { run } from "probot";
import { codeReviewBot } from "./bot";


run(codeReviewBot)