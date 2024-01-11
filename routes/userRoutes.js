const {Router} = require('express');
const { registerUser, loginUser, getUserInfo, forgetPassword, resetPassword } = require('../controller/userController');
const validateToken = require('../middleware/validateToken')
const router = Router();

router.post("/register", registerUser)

router.post('/login', loginUser)

router.get("/userinfo", validateToken, getUserInfo)

router.post("/forget-password", forgetPassword)

router.patch("/reset-password", resetPassword)

module.exports = router;