const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const bcrypt = require('bcrypt')
const config = {
  logging: false
};

const jwt = require('jsonwebtoken');
const { user } = require('pg/lib/defaults');

const tokenSecret = 'SECRET_PHRASE'

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

const Note = conn.define('note', {
  text: STRING,
});

Note.belongsTo(User);
User.hasMany(Note);



User.byToken = async(token)=> {
  try {
    console.log({token})
    console.log(tokenSecret)
    const verifiedToken = jwt.verify(token, tokenSecret);
    
    
    if(verifiedToken){
      const user = await User.findByPk(verifiedToken.id);
      // console.log('user ', verifiedToken)
      return user
    }
    
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });

  const match = await bcrypt.compare(password, user.password);
  // console.log(match)

  if(match){
    // const token = jwt.sign({
    //   id: user.id,
    //   username: user.username
    // }, tokenSecret)
    // console.log("token", token)
    return user
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );

  const notes = [
    { text: 'text1'},
    { text: 'text2'},
    { text: 'text3'},
    { text: 'text4'},
    { text: 'text5'},
    { text: 'text6'},
    { text: 'text7'},
  ];

  const [ text1,text2,text3,text4,text5,text6,text7 ] = await Promise.all(
    notes.map( item => Note.create(item))
  );
  await lucy.setNotes([text1,text2]);
  // await lucy.setNotes(text2);
  await moe.setNotes([text3,text4]);
  // await moe.setNotes();
  await larry.setNotes([text5,text6,text7]);
  // await larry.setNotes();
  // await larry.setNotes();
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
}

User.prototype.generateToken = async function() {
  const token = await jwt.sign({id: user.id}, tokenSecret)
  // console.log(token)
  return (token)
}

User.beforeCreate(user => {
    const salt = bcrypt.genSaltSync(5);
    user.password = bcrypt.hashSync(user.password, salt);
})

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
