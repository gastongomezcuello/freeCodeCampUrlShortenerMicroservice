require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

// url shortener microservice
const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    unique: true,
  },
  short_url: {
    type: Number,
    unique: true,
  },
});

const Url = mongoose.model("Url", urlSchema);

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;

  Url.findOne({ original_url: url }).then((data) => {
    if (data) {
      res.json({
        original_url: data.original_url,
        short_url: data.short_url,
      });
    } else {
      Url.countDocuments().then((count) => {
        const newUrl = new Url({
          original_url: url,
          short_url: count + 1,
        });

        newUrl.save().then((data) => {
          res.json({
            original_url: data.original_url,
            short_url: data.short_url,
          });
        });
      });
    }
  });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const short_url = req.params.short_url;
  Url.findOne({ short_url: short_url }, (err, data) => {
    if (err) {
      console.error(err);
      res.json({ error: "invalid url" });
    } else {
      res.redirect = data.original_url;
    }
  });
});
