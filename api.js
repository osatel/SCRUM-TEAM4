var router = require('express').Router();

router.use('*', function(req, res, next){
    req.session.person_id = 105;
    req.session.save();
    next();
});

router.use('/language', require('./api/language'));
router.use('/auth', require('./api/auth'));
router.use('/user', require('./api/user'));
router.use('/group', require('./api/group'));
router.use('/shoppingList', require('./api/shoppingList'));
router.use('/currency', require('./api/currency'));
router.use('/tasks', require('./api/tasks'));
router.use('/budget', require('./api/budget'));
router.use('/news', require('./api/news'));
router.use('/notify', require('./api/notify'));

module.exports = router;
