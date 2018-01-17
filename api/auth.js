var router = require('express').Router();
var bcrypt = require('bcrypt');

module.exports = router;

/**
 * Log out the current user
 *
 * URL: /api/auth/logout
 * method: POST
 */
router.post('/logout', function(req, res) {
    req.session.destroy();
    res.status(200).json({login: false});
});

/**
 * Login the user
 *
 * URL: /api/auth/login
 * method: POST
 * data: {
 *      username,
 *      password
 * }
 */
router.post('/', function(req, res){
    var loginVariable, username = req.body.username, password = req.body.password;
    if (!username || !password) {
        res.status(400).json({login: false, error: "login failed"});
        return;
    }

    pool.getConnection(function (err, connection) {
        if (err) { res.status(500).json({error: "no connection to server"})}
        else connection.query("SELECT person_id, password_hash FROM person WHERE ?? = ?;",
            [((username.indexOf("@") == -1) ? 'username' : 'email'), username], function (error, results) {
            connection.release();
            if(err) {return res.status(500).json({'Error' : 'connecting to database: ' } + err)}
            else bcrypt.compare(password, results[0].password_hash, function(err, hash_res) {
                if (hash_res) {
                    req.session.person_id = results[0].person_id;
                    req.session.save();
                    res.status(200).json({login: true, person_id: results[0].person_id});
                }
                else { res.status(400).json({login: false, error: "login failed"}); }
            });
        });
    });
});

/**
 * Check if the user is logged in
 *
 * URL: /api/auth
 * method: GET
 */
router.get('/', function(req, res) {
    res.status(200).json({login: !!req.session.person_id});
});

/**
 * Login and registration with facebook
 *
 * URL: /api/auth/facebook
 * method: POST
 * data: {
 *      facebook_api_id,
 *      forename,
 *      lastame,
 *      email
 * }
 */
router.post('/facebook', function(req, res){
    pool.getConnection(function (err, connection) {
        connection.query("SELECT person_id FROM person WHERE facebook_api_id = ?;", [req.body.facebook_api_id], function (error, results) {
            if(err) {
                res.status(500).json({'Error' : 'connecting to database: ' } + err);
            } else if (results.length == 1) {
                connection.release();

                req.session.person_id = results[0].person_id;
                req.session.save();

                res.status(200).json({login: true, person_id: results[0].person_id});
            } else {
                connection.beginTransaction(function(err){
                    if(err) {res.status(500).send("Error");}
                    else connection.query("INSERT INTO shopping_list (currency_id) VALUES (?)", [100], function(err, result){
                        if (err) {res.status(500).json({'error': 'connecting to database'} + err); }
                        else {
                            var values = [
                                req.body.email,
                                req.body.facebook_api_id,
                                req.body.forename,
                                req.body.lastname,
                                result.insertId,
                                req.body.facebook_api_id
                            ];

                            connection.query('INSERT INTO person ' +
                                '(email, username, forename, lastname, shopping_list_id, facebook_api_id) ' +
                                'VALUES (?,?,?,?,?,?)', values, function(err, result) {
                                if(err) { res.status(500).send("Fail"); }
                                else {
                                    connection.commit(function (err) {
                                        if (err) {
                                            connection.rollback(function (err) {
                                                if (err) console.error(err);
                                                res.status(500).send("Transaction fail");
                                            });
                                        } else {
                                            req.session.person_id = result.insertId;
                                            req.session.save();
                                            res.status(200).send(true);
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    });
});