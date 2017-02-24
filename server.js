//petition project
var spicedPg = require('spiced-pg');
var db = spicedPg('postgres:kendr:soybean88@localhost:5432/kendra');
const express = require('express');
const app = express();
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const chalk = require('chalk');
var cookieSession = require('cookie-session');
var passwordAuth = require('./passwordauth');

app.use(cookieSession({
    secret: 'working is for old people',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: false
}));

//////registration page
app.get('/', function(req, res) {
    console.log(chalk.magenta(req.method, req.url));
    res.render('register', {
        layout: 'main',
    });
});

app.post('/', function(req, res) {
    if(req.body.firstInput && req.body.lastInput && req.body.emailInput && req.body.passInput) {
        passwordAuth.hashPassword(req.body.passInput, function(err, hashedPass) {
            if (err) {
                console.log(err);
            } else {
                var query = 'INSERT INTO users (first_name, last_name, email_address, password) VALUES ($1, $2, $3, $4) RETURNING id';
                db.query(query, [req.body.firstInput, req.body.lastInput, req.body.emailInput, hashedPass], function(err, results) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.session.user = {
                            userID: results.rows[0].id,
                            firstName: req.body.firstInput,
                            lastName: req.body.lastInput
                        };
                        res.redirect('/petition');
                    }
                });
            }
        });
    } else {
        res.render('register', {
            layout: 'main',
            error: 'true'
        });
    }
});

//////login page
app.get('/signin', function(req, res) {
    console.log(chalk.magenta(req.method, req.url));
    res.render('signin', {
        layout: 'main',
    });
});

app.post('/signin', function(req, res) {
    if(req.body.emailInput && req.body.passInput) {
        var query = 'SELECT password FROM users where id = $1 RETURNING password;';
        db.query(query, [req.session.user.userID], function (err, results) {
            if(err) {
                console.log(err);
            } else {
                passwordAuth.checkPassword(req.body.passInput, results.rows[0].password, function(err, doesMatch) {
                    if(err) {
                        console.log(err);
                    } else if (doesMatch) {
                        req.session.user.loggedin = 'yes';
                        //add if statement that if the user has completed the info, to send them to the thank you
                        res.redirect('/info');
                    } else {
                        res.render('signin', {
                            layout: 'main',
                            error: 'true'
                        });
                    }
                });
            }
        });
    }
});

//////collect user info page
app.get('/info', function(req, res) {
    console.log(chalk.magenta(req.method, req.url));
    res.render('info', {
        layout: 'main',
    });
});

app.post('/info', function(req, res) {
    if(req.session.user.loggedin == 'yes') {
        var query = 'SELECT count(*) AS num_user_data FROM user_profiles WHERE user_id = $ RETURNING num_user_data;';
        db.query(query, [req.session.user.userID], function(err, results) {
            if(err) {
                console.log(err);
            } else {
                if(results.rows[0].num_user_data >= 1) {
                    res.redirect('/petition');
                } else {
                    var query = 'INSERT INTO user_profiles (user_id, age, city, homepage) VALUES ($1, $2, $3, $4)';
                    db.query(query, [req.session.user.userID, req.body.ageInput, req.body.cityInput, req.body.homepageInput], function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect('/petition');
                        }
                    });
                }
            }
        });
    } else {
        res.redirect('/register');
    }
});

//////collect user signature
app.get('/petition', function(req, res) {
    console.log(chalk.magenta(req.method, req.url, req.header));
    res.render('petition', {
        layout: 'main',
    });
});

//need to update this function to remove the first and last name and tie this page to user table
app.post('/petition', function(req, res) {
    if(req.session.signatureID) {
        res.redirect('/thankyou');
    } else {
        if(req.body.firstInput && req.body.lastInput && req.body.dataURL) {
            var query = 'INSERT INTO signatures (first_name, last_name, signature, user_id) VALUES ($1, $2, $3, $4) RETURNING id';
            db.query(query, [req.body.firstInput, req.body.lastInput, req.body.dataURL, req.session.user.userID], function(err, results) {
                if (err) {
                    console.log(err);
                } else {
                    req.session.signatureID = results.rows[0].id;
                }
                res.redirect('/thankyou');
            });
        } else {
            res.render('petition', {
                layout: 'main',
                error: 'true'
            });
        }
    }
});

//////display user signature
//need to update based on new user id
app.get('/thankyou', function(req, res) {
    console.log(chalk.magenta(req.method, req.url, req.header));
    var query = 'SELECT signature FROM signatures where id = $1;';
    db.query(query, [req.session.signatureID], function (err, results) {
        if(err) {
            console.log(err);
        } else {
            res.render('thankyou', {
                layout: 'main',
                signature: results.rows
            });
        }
    });
});

//////display list of supporters
//need to update to include city, age, homepage 
app.get('/supporters', function(req, res) {
    console.log(chalk.magenta(req.method, req.url, req.header));
    var query = 'SELECT first_name, last_name FROM signatures;';
    db.query(query, function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render('supporters', {
                layout: 'main',
                signers: results.rows
            });
        }
    });
});



app.listen(8080, function() {
    console.log(`listening`);
});
