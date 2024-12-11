const User = require("../models/userModels");
const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken');



const signUp = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation: Check if all required fields are present
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required: username, email, and password.",
            success: false,
        });
    }

    try {
        // Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({
                message: "User already exists, go to the login page.",
                success: false,
            });
        }

        // Create a new user
        bcrypt.genSalt(12, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
                const newUser = await User.create({
                    username,
                    email,
                    password: hash
                });

                const token = jwt.sign({ email }, process.env.JWT_TOKEN);
                res.cookie("token", token, { httpOnly: true, secure: true });

                return res.status(201).json({
                    message: "User Created",
                    success: true,
                    newUser
                });
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: "Signup error: " + error.message,
            success: false
        });
    }
}


//   Signin



const logIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User Not Found, go to Signup Page",
                success: false
            })
        };


        bcrypt.compare(password, user.password, function (err, result) {

            if (!result) {
                return res.status(401).json({
                    message: "Wrong Password ",
                    success: false
                })
            };

            const token = jwt.sign({ email, role: user.role }, process.env.JWT_TOKEN)
            res.cookie("token", token, { httpOnly: true, secure: true });

            return res.status(200).json({
                message: "User logged In",
                success: true,
                token,
                user
            })

        });

    } catch (error) {
        return res.status(500).json({
            message: "Signup error " + error,
            success: false
        })
    }

}



module.exports = { signUp, logIn }