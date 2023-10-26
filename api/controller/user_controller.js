const mongoose = require('mongoose')
const User = require('../model/userModel')
const bcypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const OTP = require('../models/OTP')
const otpGenerator = require("otp-generator")
require('dotenv').config()

const baseUrl = "https://shope-product-api-jetpackcompose.fly.dev"
const path = require('path')


exports.sign_up = (req, res) => {
  User.find({ email: req.body.email })
    .then((users) => {
      if (users.length >= 1) {
        return res.status(409).json({ message: 'Mail exists' });
      } else {
        
        // handling the paassword 
        const saltRounds = 10

        bcypt.hash(req.body.password, saltRounds, (err, hash) => {
          if (err) {
            return res.status(500).json({ error: err });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              phone: req.body.phone,
              dateJoined: req.body.dateJoined,
            });

            user
              .save()
              .then((savedUser) => { // Change the variable name here to savedUser
                const token = jwt.sign(
                  { userId: savedUser._id }, // Use savedUser here as well
                  process.env.JWT_KEY,
                  { expiresIn: '30d' }
                );
                res.status(201).json({
                  success : true,
                  message: 'User created successfully',
                  token: token,
                  data: savedUser._id // Use savedUser here too
                });
              })
              .catch((err) => {
                res.status(500).json({ error: 'Server error ' + err.message });
              });
          }
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Server error ' + err.message });
    });
};
exports.get_users = (req, res, next) => {
  User.find()
    .select('_id email password picture firstname phone lastname  dateJoined')
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        users: docs.map(doc => {
          const pictureUrl = doc.picture ? `${baseUrl}/uploads/${path.basename(doc.picture)}` : null;
          const phone = doc.phone ? doc.phone : null;
       

          return {
            password: doc.password,
            picture: pictureUrl,
            email: doc.email,
            _id: doc._id,
            firstname: doc.firstname,
            phone: phone,
            lastname: doc.lastname,
            dateJoined: doc.dateJoined,
            request: {
              Type: 'GET',
              url: `${baseUrl}/user/${doc._id}`
            }
          };
        })
      };

      res.status(200).json(response);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
};
exports.sign_in = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      res.status(401).json({ 
        success : false,
        message: 'Invalid E-mail' });
      return;
    }

    const isMatch = await bcypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ 
        success : false,
        message: 'Invalid Password' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: '30h' });
    res.status(200).json(
      {
        success : true,
        message: 'Authenification Succfully',
        token: token,
        data: user._id
      }
    )

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

exports.delete_user_by_id = (req, res, next) => {
  const id = req.params.userid

  User.findByIdAndDelete(id)
    .exec()
    .then(result => {
      res.status(200).json({
        message: 'User Deleted'
      })
    })
    .catch(err => {
      res.status(200).json({ error: err })
    })

}
exports.delete_all = (req, res, next) => {
  User.deleteMany({})
    .exec()
    .then(result => {
      res.status(200).json({
        message: 'All user deleted',
        result: result
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
}
exports.fetch_by_id = (req, res, next) => {
  const id = req.params.userid
  User.findById(id)
  .select('_id email password picture firstname phone lastname  dateJoined')
  .exec()
    .then(doc => {
      console.log(doc)
      // check if the user is not null 
      if (doc) {
        res.status(200).json(doc)
      } else {

        res.status(404).json({
          message: "Invalide ID Of This User"
        })
      }
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ error: err })
    })

}

exports.update_user = (req, res, next) => {
  const userId = req.params.userid; // Get the user ID from the request parameters

  // Check if the request contains a file upload
  if (req.file) {
    // If a file is uploaded, include the picture field in the update operations
    req.body.picture = req.file.path;
  }

  // Create an object with the updated user information
  const updateOps = {};

  for (const [key, value] of Object.entries(req.body)) {
    if (value !== null && value !== undefined) {
      updateOps[key] = value;
    }
  }

  // Update the user document by ID
  User.findByIdAndUpdate(userId, { $set: updateOps }, { new: true })
    .exec()
    .then(result => {
      if (!result) {
        return res.status(404).json({ message: 'User not found', isUpdate: false });
      }

      res.status(200).json({ message: 'User updated successfully', user: result, isUpdate: true });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};
exports.sendotp = async (req, res) => {
	try {
		 // const { email } = req.body;

    const email = req.body.email 

		// Check if user is already present
		// Find user with provided email
		const checkUserPresent = await User.findOne({ email });
		// to be used in case of signup

		// If user found with provided email
		if (checkUserPresent) {
			// Return 401 Unauthorized status code with error message
			return res.status(401).json({
				success: false,
				message: `User is Already Registered`,
			});
		}

		var otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});
		const result = await OTP.findOne({ otp: otp });
		console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);
		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
			});
		}
		const otpPayload = { email, otp };
		const otpBody = await OTP.create(otpPayload);
		console.log("OTP Body", otpBody);
		res.status(200).json({
			success: true,
			message: `OTP Sent Successfully`,
			otp,
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({ success: false, error: error.message });
	}
};