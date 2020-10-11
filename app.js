const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");
const cardRoutes = require("./routes/ebcard-routes");
const peopleRoutes = require("./routes/people-routes");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  //to disable CORS origin restriction
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/people", peopleRoutes);
app.use("/ebcards", cardRoutes);

app.use((req, res, next) => {
  throw new HttpError("Couldn't find the path!", 404);
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path);
  }

  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "Something went wrong!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kvvwr.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useUnifiedTopology: true, useNewUrlParser: true }
  )
  .then(() => {
    app.listen( process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
