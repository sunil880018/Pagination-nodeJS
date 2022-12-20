import express from "express";
import { dbConnection } from "./database/db.js";
import bodyParser from "body-parser";
import { apiRequestLimiter } from "./middleware/apiRateLimiter.js";
import { CONFIG } from "./config/config.js";
import { NotFoundError, BadRequestError } from "./errors/index.js";

import { Sample } from "./models/Sample.js";
import { StatusCodes } from "http-status-codes";
dbConnection();
const app = express();
const PORT = CONFIG.PORT;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(apiRequestLimiter);

// pagination
app.get("/", async (req, res) => {
  const { page } = req.query;
  try {
    if (!page) {
      throw new BadRequestError("Please provide page");
    }
    const pageNumber = parseInt(page);
    if (pageNumber <= 0) {
      throw new BadRequestError(`invalid page ${pageNumber}`);
    }

    const pageSize = 5;
    const samples = await Sample.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    if (!samples) {
      throw new NotFoundError("Not Found!");
    } else if (samples.length === 0) {
      throw new NotFoundError("Page Size too large !");
    } else return res.status(StatusCodes.OK).json({ samples });
  } catch (error) {
    if (error.statusCode === 400) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: error.statusCode, msg: error.message });
    }
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: error.statusCode, msg: error.message });
  }
});

app.post("/sample", async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      throw new BadRequestError("Please provide name");
    }
    const sample = await Sample.create({ name });
    return res.status(StatusCodes.CREATED).json({ sample });
  } catch (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: error.statusCode, msg: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`server run at ${PORT}`);
});
