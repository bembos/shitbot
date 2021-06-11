//Passport conf
const LocalStrategy = require('passport-local').Strategy;

//Bcrypt
const bcrypt = require('bcryptjs');

//Access to the database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

//Configuration for passport to use username and password for login
module.exports = function(passport) {
    passport.use(
        new LocalStrategy({usernameField : 'email'},(email,password, done)=> {
                //match user
                prisma.user.findUnique({
                    where: {
                      email: email,
                    },
                  })
                .then((user)=>{
                 if(!user) {
                     return done(null,false,{message : 'that email is not registered'});
                 }
                 //match pass
                 bcrypt.compare(password,user.password,(err,isMatch)=>{
                     if(err) throw err;

                     if(isMatch) {
                         return done(null,user);
                     } else {
                         return done(null,false,{message : 'pass incorrect'});
                     }
                 })
                })
                .catch((err)=> {console.log(err)})
        })
        
    )

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
      
    passport.deserializeUser(function(id, done) {
        prisma.user.findUnique({
                where: {
                    id: id,
                },
            }).then((user) => {
                done(null, user);
            }).catch(err => { done(err, null); });
    }); 
}; 