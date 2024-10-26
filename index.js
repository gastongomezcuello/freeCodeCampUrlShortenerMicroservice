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

// only http or https urls are allowed
app.post("/api/shorturl", (req, res, next) => {
  const url = req.body.url;
  const regex = /^(http|https):\/\//;

  if (!regex.test(url)) {
    res.json({ error: "invalid URL" });
  } else {
    next();
  }
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }

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
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const short_url = req.params.short_url;
  Url.findOne({ short_url: short_url })
    .then((data) => {
      res.redirect(data.original_url);
    })
    .catch((err) => {
      res.json({ error: "No short URL found for the given input" });
    });
});
