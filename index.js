const express = require('express')
const app = express()
const morgan = require('morgan')
const mongoose = require('mongoose');
require('dotenv').config()
const userRouter = require('./api/routes/user')

const PORT = process.env.PORT || "8080"

const connectDB = async() => {
    try{
        const conn = await mongoose.connect('mongodb+srv://bouderouazakaria:'+process.env.MONGO_ATLAS_PW+'@jetpackcompose.kxcnp9w.mongodb.net/?retryWrites=true&w=majority')
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        }catch(error){
            console.log(error);
            process.exit(1);
          }

}



// Use Morgan middleware
// we use morgan to logg(enregitstre) the info of the req like the ip client and status req
app.use(morgan('dev'));

//  This is a middleware function in an Express.js application that handles Cross-Origin Resource Sharing (CORS)
//  for incoming HTTP requests.
//  The code sets the required HTTP headers that allow resources on a web page to be requested
 // from a different domain than the one which served the initial page.
 app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin','*')
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization')
    if( req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods','PUT, POST,PATCH ,DELETE,GET')
        return res.status(200).json({})
    }
    next()
})

// make the file that contain all images is accessible  (permission)
app.use('/app/uploads', express.static('uploads'));
app.use('/uploads', express.static('uploads'));

// Middleware for parsing JSON data and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// *use()* is Middleware, which are functions that can be executed before or after a request is
// processed. Middleware can be used to handle common tasks such 
// as authentication, logging, and error handling
// Route which should handle request 


app.use('/user',userRouter)

app.use((req, res, next) => {
    const error = new Error('Not found ')
    error.status = 404
    next(error)
})

// this will work with database 
app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })

})

//Connect to the database before listening
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
})

/// IiiuFStmdAAEIwIn