const bcrypt = require('bcryptjs');
const goose = require("mongoose");
let Schema = goose.Schema;

let userSchema = new Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [{ dateTime: Date, userAgent: String }]
});
// to be defined on new connection (see initialize)
let User; 
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = goose.createConnection("REMOVED");
        db.on('error', (err) => {
            reject(err); 
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        }
        else {
            // Generate a salt using 10 rounds
            bcrypt.genSalt(10)  
                // encrypt the password
                .then(salt => bcrypt.hash(userData.password, salt)) 
                .then(hash => {
                    userData.password = hash;
                    let newUser = User(userData);
                    newUser.save().then(() => {
                        resolve();
                    }).catch((err) => {
                        if (err.code === 11000) {
                            reject("Username is already taken");
                        }
                        else {
                            reject("There was an error creating a user: " + err);
                        }
                    })
                })
                .catch(err => {
                    console.log(err); 
                });
        }
    });
};

//Checks user for login by matching usernames and passwords
module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName }).then((usr) => {
            if (usr.length === 0) {
                console.log("cant find user");
                reject("Unable to find user " + userData.userName);
            }
            bcrypt.compare(userData.password, usr[0].password).then((result) => {
                if (result === false) {
                    reject(userData.userName + ": Incorrect username or password");
                }
                //if the provided password is correct, then 
                else {
                    usr[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                    console.log({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                    console.log("history:: " + usr[0].loginHistory)
                    usr[0].updateOne(
                        { userName: usr[0].userName },
                        { $set: { loginHistory: usr[0].loginHistory } }
                    ).then(() => {
                        console.log("resolving user" + usr[0]);
                        resolve(usr[0]);
                    });
                }
            });
        }).catch(() => {
            reject("There was an error verifying the user: " + userData.userName);
        })
    });
}