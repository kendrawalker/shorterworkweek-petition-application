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
                            lastName: req.body.lastInput,
                            loggedin: 'yes'
                        };
                        res.redirect('/info');
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
        var query = 'SELECT first_name, last_name, id, email_address, password FROM users WHERE email_address = $1;';
        db.query(query, [req.body.emailInput], function (err, results) {
            if(err) {
                console.log(err);
            } else {
                passwordAuth.checkPassword(req.body.passInput, results.rows[0].password, function(err, doesMatch) {
                    if(err) {
                        console.log(err);
                    } else if (doesMatch) {
                        req.session.user = {
                            userID: results.rows[0].id,
                            firstName: results.rows[0].first_name,
                            lastName: results.rows[0].last_name,
                            loggedin: 'yes'
                        };
                        console.log(req.session.user);
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
    if(req.session.user.loggedin == 'yes') {
        console.log(22);
        var query = 'SELECT * FROM user_profiles WHERE user_id = $1;';
        db.query(query, [req.session.user.userID], function(err, results) {
            console.log(req.session.user);
            console.log(req.session.user.userID);
            console.log(results.rows[0]);
            if(err) {
                console.log(err);
            } else {
                if(results.rows[0]) {
                    res.redirect('/petition');
                } else {
                    res.render('info', {
                        layout: 'main',
                    });
                }
            }
        });
    } else {
        res.redirect('/');
    }
});

app.post('/info', function(req, res) {
    console.log(req.session.user.userID, req.body.ageInput, req.body.cityInput, req.body.homepageInput);
    var query = 'INSERT INTO user_profiles (user_id, age, city, homepage) VALUES ($1, $2, $3, $4)';
    db.query(query, [req.session.user.userID, req.body.ageInput, req.body.cityInput, req.body.homepageInput], function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/petition');
        }
    });
});

//////collect user signature
app.get('/petition', function(req, res) {
    console.log(chalk.magenta(req.method, req.url));
    if(req.session.user.loggedin == 'yes') {
        var query = 'SELECT * FROM signatures WHERE user_id = $1;';
        db.query(query, [req.session.user.userID], function(err, results) {
            console.log(results.rows[0]);
            if(err) {
                console.log(err);
            } else {
                if(results.rows[0]) {
                    res.redirect('/thankyou');
                } else {
                    res.render('petition', {
                        layout: 'main',
                    });
                }
            }
        });
    } else {
        res.redirect('/');
    }
});

app.post('/petition', function(req, res) {
    if(req.body.dataURL) {
        var query = 'INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id';
        db.query(query, [req.body.dataURL, req.session.user.userID], function(err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/thankyou');
            }
        });
    } else {
        res.render('petition', {
            layout: 'main',
            error: 'true'
        });
    }
});

//////display user signature
app.get('/thankyou', function(req, res) {
    if(req.session.user.loggedin == 'yes') {
        console.log(chalk.magenta(req.method, req.url));
        var query = 'SELECT signature FROM signatures WHERE user_id = $1;';
        db.query(query, [req.session.user.userID], function (err, results) {
            if(err) {
                console.log(err);
            } else {
                res.render('thankyou', {
                    layout: 'main',
                    signature: results.rows
                });
            }
        });
    } else {
        res.redirect('/');
    }
});

//////display list of supporters
app.get('/supporters', function(req, res) {
    if(req.session.user.loggedin == 'yes') {
        console.log(chalk.magenta(req.method, req.url, req.header));
        var query = 'SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.homepage FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id;';
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
    } else {
        res.redirect('/');
    }
});


//////display list of supporters by city
app.get('/supporters/:something', function(req, res) {
    console.log(req.params.something);
    if(req.session.user.loggedin == 'yes') {
        var query = 'SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.homepage FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE user_profiles.city = $1;';
        db.query(query, [req.params.something], function(err, results) {
            if (err) {
                console.log(err);
            } else {
                res.render('supporters', {
                    layout: 'main',
                    signers: results.rows
                });
            }
        });
    } else {
        res.redirect('/');
    }
});


//////update info
app.get('/update', function(req, res) {
    var query = 'SELECT users.first_name AS first_name, users.last_name AS last_name, users.email_address AS email_address, users.password, user_profiles.age AS age, user_profiles.city AS city, user_profiles.homepage AS homepage FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = $1;';
    db.query(query, [req.session.user.userID], function(err, results) {
        if(err) {
            console.log(err);
        } else {
            res.render('update', {
                layout: 'main',
                userdata: results.rows
            });
        }
    });
});

app.post('/update', function(req, res) {
    console.log(req.body.firstInput, req.body.lastInput, req.body.emailInput, req.body.passInput, req.body.ageInput, req.body.cityInput, req.body.homepageInput);
    if (req.body.passInput) {
        console.log("it was not blank");
        passwordAuth.hashPassword(req.body.passInput, function(err, hashedPass) {
            if (err) {
                console.log(err);
            } else {
                var query = 'UPDATE users SET first_name=$1, last_name=$2, email_address=$3, password=$4 WHERE id = $5;';
                db.query(query, [req.body.firstInput, req.body.lastInput, req.body.emailInput, hashedPass, req.session.user.userID], function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.session.user.firstName= req.body.firstInput;
                        req.session.user.lastName= req.body.lastInput;
                        var query2 = 'UPDATE user_profiles SET age=$1, city=$2, homepage=$3 WHERE user_id = $4;';
                        db.query(query2, [req.body.ageInput, req.body.cityInput, req.body.homepageInput, req.session.user.userID], function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.redirect('/thankyou');
                            }
                        });
                    }
                });
            }
        });
    } else {
        console.log("no password entered");
        var query = 'UPDATE users SET first_name=$1, last_name=$2, email_address=$3 WHERE id = $4;';
        db.query(query, [req.body.firstInput, req.body.lastInput, req.body.emailInput, req.session.user.userID], function(err) {
            if (err) {
                console.log(err);
            } else {
                req.session.user.firstName= req.body.firstInput;
                req.session.user.lastName= req.body.lastInput;
                var query2 = 'UPDATE user_profiles SET age=$1, city=$2, homepage=$3 WHERE user_id = $4;';
                db.query(query2, [req.body.ageInput, req.body.cityInput, req.body.homepageInput, req.session.user.userID], function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/thankyou');
                    }
                });
            }
        });
    }
});


//////delete signature
app.get('/deletesign', function(req, res) {
    var query = 'DELETE FROM signatures WHERE user_id = $1;';
    db.query(query, [req.session.user.userID], function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/petition');
        }
    });
});


//////logout
app.get('/logout', function(req, res) {
    req.session.user = {};
    res.redirect('/');
});

app.listen(process.env.PORT || 8080, function() {
    console.log(`listening`);
});
