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

app.listen(80);