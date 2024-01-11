const crypto = require('crypto');
const nodemailer = require('nodemailer');
const con = require('../config/connectionDB');

const generateResetToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);
    return {token, expires: expirationTime}
}

const fetchTokenAndExpiry=(token)=>{

    const query = `
        SELECT email, resetExpires
        FROM user 
        WHERE resetToken='${token}'
    `;

    return new Promise((resolve, reject) => {
        con.query(query, (err, result) => {
            if(err) {
                reject(`Error while retreiving token and expiry in db. ${err}`);
            } else{
                resolve({email:result[0].email, resetExpires:result[0].resetExpires});
            }
        });
    });
}

const checkResetTokenExpire=(resetTokenExpire) => {
    if(!resetTokenExpire) {
        return true;
    }
    const expireToken = new Date(resetTokenExpire);
    const current = new Date();
    const diff = expireToken - current;
    return (diff > 600000);
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
});

const sendResetTokenToMail = async(email, resetToken) => {
    
    const info = await transporter.sendMail({
        from: {
            name: 'Snabb Tech',
            address: process.env.EMAIL
        },
        to: email,
        subject: "Reset Password Link",
        text: `
            Hi,
                Find below your reset password link and it is valid for 10 minutes.

                Paste the link in the postman or any other api testing plateform.

                reset link: http://localhost:${process.env.PORT || 5000}/api/reset-password?token=${resetToken}

                Regards,
                SnabbTech Team
            `
    });
}

const saveTokenToDatabase = async (email, resetToken) => {
    const formattedExpires = resetToken.expires.toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        UPDATE user 
        SET resetToken='${resetToken.token}', resetExpires='${formattedExpires}'
        WHERE email='${email}'
    `;

    return new Promise((resolve, reject) => {
        con.query(query, (err, result) => {
            if(err) {
                reject(`Error while storing token in db. ${err}`);
            } else{
                resolve();
            }
        });
    });
};

const checkEmailInDb = (userEmail) => {
    return new Promise((resolve, reject) => {
        const query =  `SELECT COUNT(*) as emailCount FROM user WHERE email=${con.escape(userEmail)}`;
        con.query(query, (err, result) => {
            if(err) {
                reject(`Error while checking email in Db. ${err}`);
            } else {
                const emailCnt = result[0].emailCount;
                resolve(emailCnt > 0);
            }
        })
    })
}

const savePasswordToDatabase = async(email, password) => {
    return new Promise((resolve, reject) => {
        const updateQuery = `UPDATE user SET password=? WHERE email=?`;

        con.query(updateQuery, [password, email], (err, result) => {
            if(err) {
                reject(`Error while updating password in Db. ${err}`);
            } else {
                resolve();
            }
        })
    })
}

const checkPassword = async(password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    return new Promise((resolve, reject) => {
        if(!passwordRegex.test(password)) {
            reject("Password should contain at least 1 uppercase, 1 lowercase, 1 special character, 1 number, and be at least 8 characters long");
        }else {
            resolve(true)
        }
    })
}


module.exports={generateResetToken, sendResetTokenToMail, checkResetTokenExpire, saveTokenToDatabase, fetchTokenAndExpiry, checkEmailInDb, savePasswordToDatabase, checkPassword}