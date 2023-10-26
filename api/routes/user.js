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
router.post('/sign-up', UserController.sign_up)

router.post('/sign-in', UserController.sign_in)

router.post('/opt', UserController.sendotp)

// deleting the user by id 
router.delete('/:userid', UserController.delete_user_by_id)

// DELETE route to delete all user
router.delete('/', UserController.delete_all);

router.get('/', UserController.get_users)

// fetching by id 
router.get('/:userid', checkAuth, UserController.fetch_by_id)

router.patch('/:userid', upload.single('picture'), UserController.update_user);


// this line means that if u want to use this function(router) in other file(class) u should export it  
module.exports = router