const AUTH_KEY = process.env.AUTH_KEY;
if(!AUTH_KEY) {
  throw 'process.env.AUTH_KEY must be set!';
}

const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.static('static', { index: 'index.html' }));

const nedb = require('nedb-promises');
const db = new nedb({ filename: 'posts.ndjson', autoload: true });
const marked = require('marked');

app.get('/posts.json', async (req, res) => {
  let posts;
  let limit = req.query.limit ? req.query.limit : 500;
  let target_fields = req.query.fields ?
    req.query.fields.split(',').reduce((o, field) => (o[field] = 1) && o, {}) : {};

  try {
    posts = (await db.find({}, target_fields).sort({ created_ts: -1 }).limit(limit))
      .map(post => {
        if(post.body_markdown) {
          post.body_markdown = marked(post.body_markdown);
        }
        return post;
      });

    res.json(posts);
  }
  catch(error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get('/marked.json', async (req, res) => {
  let plain_text = req.query.plain_text;
  res.json({ marked_html: marked(plain_text) });
});

app.get('/publish_post.json', async (req, res) => {
  let is_authorized = req.query.key === AUTH_KEY;
  if(is_authorized) {
    let current_time = Date.now();
    let post = {
      created_ts: current_time,
      modified_ts: current_time,
      title: req.query.title,
      body_markdown: req.query.body_markdown,
    };
    try {
      await db.update({title: post.title}, post, { upsert: true });
      res.json({ success: true });
    }
    catch(error) {
      console.error(error);
      res.sendStatus(500);
    }
  }
  else {
    res.sendStatus(403);
  }
});

https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/dwhite.codes/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/dwhite.codes/fullchain.pem'),
},
app).listen(8000);