import { Router } from "tezx";
import xprtoJobFeed from "./job-feed";

const xprtoTrainer = new Router();
xprtoTrainer.use(xprtoJobFeed)
export default xprtoTrainer;