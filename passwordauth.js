// password auth

var bcrypt = require('bcrypt');

module.exports.hashPassword = function hashPassword(plainTextPassword, callback) {
    bcrypt.genSalt(function(err, salt) {
        if (err) {
            return callback(err);
        }
        console.log(salt);
        bcrypt.hash(plainTextPassword, salt, function(err, hash) {
            if (err) {
                return callback(err);
            }
            console.log(hash);
            callback(null, hash);
        });
    });
};


module.exports.checkPassword = function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase, callback) {
    bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
        if (err) {
            return callback(err);
        }
        console.log(doesMatch);
        callback(null, doesMatch);
    });
};
