const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('static'));

const nedb = require('nedb-promises');
const db = new nedb({ filename: 'posts.ndjson', autoload: true });
const marked = require('marked');

app.get('/', async (req, res) => {
  const posts = (await db.find({}))
    .map(post => (post.body_markdown = marked(post.body_markdown)) && post);

  res.render('index', {posts: posts});
});

app.listen(8000);