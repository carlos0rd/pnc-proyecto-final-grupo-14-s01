const express = require('express');
const { register, login } = require('../controller/authController');
const router = express.Router();
const { allowRoles } = require('../middlewares/roleMiddleware');


router.post('/register', register);
router.post('/login', login);

module.exports = router;
