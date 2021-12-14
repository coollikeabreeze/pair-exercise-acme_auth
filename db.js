const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const bcrypt = require('bcrypt')
const config = {
  logging: false
};

const jwt = require('jsonwebtoken');

const tokenSecret = 'SECRET_PHRASE'

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    const verifiedToken = jwt.verify(token, tokenSecret);
    const user = await User.findByPk(verifiedToken.id);
    if(user){
      return user;
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
  console.log(match)

  if(user && match){
    const token = jwt.sign({
      id: user.id,
      username: user.username
    }, tokenSecret)
    console.log("token", token)
    return token
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

User.beforeCreate(user => {
    const salt = bcrypt.genSaltSync(5);
    user.password = bcrypt.hashSync(user.password, salt);
})

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};
