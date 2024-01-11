const con = require("../config/connectionDB");
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { generateResetToken, sendResetTokenToMail, checkResetTokenExpire, saveTokenToDatabase, fetchTokenAndExpiry, checkEmailInDb, savePasswordToDatabase, checkPassword } = require("../utils/utilMethods");

//@desc Register User
//@route POST /api/register
//@access public
const registerUser = asyncHandler(async(req, res)=>{
    const {name, email, password, mobileNumber} = req.body;

    if(!name || !email || !password || !mobileNumber) {
        res.status(400).json({message: "All fields are mandatory"})
    }
    if(mobileNumber.length !== 10) {
        res.status(400).json({message:"Mobile Number should be 10 not less or more"})
    }
    if(await checkEmailInDb(email)) {
        return res.status(400).json({message:"This Email is already registered."});
    }
    await checkPassword(password).then((resp) => console.log(resp));
    const hashedPwd = await bcrypt.hash(password, 10);

    const insertQuery = `INSERT INTO user (name, email, password, mobileNumber) VALUES(?, ?, ?, ?)`;
    const userData = [name, email, hashedPwd, mobileNumber];
    con.query(insertQuery, userData, (err, result) => {
        if(err){
            res.status(500).json({message: "Internal Server Error"})
        }
        res.status(201).json({message: 'User registered successfully'});
    })
});

//@desc Login User
//@route POST /api/login
//@access public
const loginUser = asyncHandler(async(req, res)=>{
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({message: "Email or Password is required"});
    }
    
    const selectQuery = `SELECT * FROM user WHERE email=?`
    con.query(selectQuery, email, async(err, result) => {
        if(err){
            res.status(500).json({message: "Internal Server error"});
        }
        if (result.length === 0) {
            res.status(400).json({message: "Incorrect email or password"});
        }

        const isPasswordMatch = await bcrypt.compare(password, result[0].password);

        if(isPasswordMatch) {
            const accessToken = jwt.sign({
                user: {
                    name: result[0].name, 
                    email: result[0].email,
                    id: result[0].id
                },
            },
            process.env.ACCESS_SECRET_TOKEN, {expiresIn: "10m"}
            );
            res.status(200).json({message: 'User logged In successfully', token: accessToken});
        }else {
            res.status(400).json({message: 'Incorrect email or password'});
        }        
    })

});

//@desc Get User Info
//@route GET /api/user/
//@access private
const getUserInfo = asyncHandler(async(req, res) => {
    res.json(req.user)
})

//@desc Forget Password
//@route POST /api/forget-password
//@access public
const forgetPassword = asyncHandler(async(req, res) => {
    const {email} = req.body;
    let query = `SELECT * FROM user WHERE email='${email}'`;

    con.query(query, async(err, result) => {
        if(err) {
            res.status(500).json({message:"Internal Server Error"});
        } 
        if(result.length === 0) {
            res.status(404).json({message:'Email does not exist.'});
        }

        checkEmailInDb(email)
            .then((exists) => {
                if(exists) {
                    const resetToken = generateResetToken();
                    saveTokenToDatabase(email, resetToken)
                    sendResetTokenToMail(email, resetToken.token)
                    
                    res.status(200).json({resettoken: resetToken})
                } else {
                    res.status(404).json({message: "Email doesn't exists"});
                }
            })
            .catch((err) => {
                res.status(404).json({Error: err});
            })
    })
})

//@desc Forget Password
//@route PATCH /api/reset-password
//@access public
const resetPassword = asyncHandler(async(req, res) => {
    const {token} = req.query;
    if(!token) { 
        return res.status(400).json({message:"Token is missing"});
    }

    const {email, resetExpires} = await fetchTokenAndExpiry(token);
    if(checkResetTokenExpire(resetExpires)) {
        return res.status(400).json({message:"Token has expired."});
    }
    const {newPassword, confirmPassword} = req.body;

    const isValidNewPassword = await checkPassword(newPassword);
    const isValidConfirmNewPassword = await checkPassword(confirmPassword);
    if(!isValidNewPassword || !isValidConfirmNewPassword) {
        return res.status(400).json({message: "Password is not valid."});
    }
    if(newPassword === confirmPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await savePasswordToDatabase(email, hashedPassword);
        res.status(200).json({message: "Password update successfully"});
    } else{
        res.status(400).json({message: "New Password and Confirm Password should be same."});
    }
})

module.exports = {registerUser, loginUser, getUserInfo, resetPassword, forgetPassword}
