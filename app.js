const express = require('express');
const app = express();
app.use(express.json());
const { models: { User }} = require('./db');
const { models: { Note }} = require('./db');
const path = require('path');

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

const requiredToken = async(req, res,next) => {
  try {
    // console.log(req.headers.authorization)
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    next()
} catch (err) {
  next(err)
}
}

app.post('/api/auth', async(req, res, next)=> {
  try {
    // res.send({ token: await User.authenticate(req.body)});
    const user = await User.authenticate(req.body);
    if (!user) {
      res.sendStatus(404);
    }
    const token = await user.generateToken();
    res.send(token)
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requiredToken, (req, res, next)=> {
  // try {
  //   const user = await User.byToken(req.headers.authorization);
  //   // console.log(req.headers.authorization)
  //   res.send(user)
  // }
  // catch(ex){
  //   next(ex);
  // }
  if ( req.user ) {
    res.send(req.user)
  } else {
    res.sendStatus(404);
  }
});

app.get('/api/users/:userId/notes', requiredToken, async(req,res,next) => {
  try {
    const notes = await Note.findAll({
      where: {
        userId: req.params.userId
      }
    });
    res.send(notes)
  } catch (error) {
    next(error)
  }
})

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
