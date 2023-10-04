const express = require('express')
const UserController = require('../controller/user_controller')
// this function *Router* give us the ability to handele different Routing with endpoint 
const router = express.Router()
const multer = require('multer')

// the Midele i jsute to prevent any operation without if the user not authentified 

const checkAuth = require('../middleware/check-auth')



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });


// create the registratin route 
router.post('/signUp', UserController.signUp)

router.post('/signIn', UserController.signIn)
// deleting the user by id 
router.delete('/:userId', UserController.delete_user_byID)

// DELETE route to delete all user
router.delete('/', UserController.deleteAll);

router.get('/', UserController.get_users)

// fetching by id 
router.get('/:userId', checkAuth, UserController.fetch_byID)

router.patch('/:userId', upload.single('picture'), UserController.updateUser);


// this line means that if u want to use this function(router) in other file(class) u should export it  
module.exports = router