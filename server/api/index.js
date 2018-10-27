const router = require('express').Router()

router.use('/auth', require('./auth'));
router.use('/products', require('./products'))
router.use('/users', require('./users'))
router.use('/categories', require('./categories'))
router.use('/reviews', require('./review'))
router.use('/orders', require('./orders'))

module.exports = router