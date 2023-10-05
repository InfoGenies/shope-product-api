const mongoose = require('mongoose')
const User = require('../model/userModel')
const bcypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const baseUrl = "https://shope-product-api-jetpackcompose.fly.dev";
const path = require('path')


exports.signUp = (req, res) => {
  User.find({ email: req.body.email })
    .then((users) => {
      if (users.length >= 1) {
        return res.status(409).json({ message: 'Mail exists' });
      } else {
        bcypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            res.status(500).json({ error: err });
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
              .then((res) => {
                const token = jwt.sign(
                  { userId: user._id },
                  process.env.JWT_KEY,
                  { expiresIn: '30d' }
                );
                res.status(201).json({
                  message: 'User created successfully',
                  token: token,
                  id: user._id
                });
              })
              .catch((err) => {
                res.status(500).json({ error: err });
              });
          }
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    });
};
exports.get_users = (req, res, next) => {
  User.find()
    .select('_id email password picture username phone language aboutMe userType dateJoined')
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        users: docs.map(doc => {
          const pictureUrl = doc.picture ? `${baseUrl}/uploads/${path.basename(doc.picture)}` : null;
          const phone = doc.phone ? doc.phone : null;
          const language = doc.language ? doc.language : null;
          const aboutMe = doc.aboutMe ? doc.aboutMe : null;

          return {
            password: doc.password,
            picture: pictureUrl,
            email: doc.email,
            _id: doc._id,
            username: doc.username,
            phone: phone,
            language: language,
            aboutMe: aboutMe,
            userType: doc.userType,
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
exports.signIn = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: '30h' });
    res.status(200).json(
      {
        message: 'Authenification Succfully',
        token: token,
        id: user._id
      }
    )

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

exports.delete_user_byID = (req, res, next) => {
  const id = req.params.userId

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
exports.deleteAll = (req, res, next) => {
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
exports.fetch_byID = (req, res, next) => {
  const id = req.params.userId
  User.findById(id)
    .select('_id email picture password username phone language aboutMe userType  dateJoined')
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

exports.updateUser = (req, res, next) => {
  const userId = req.params.userId; // Get the user ID from the request parameters

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