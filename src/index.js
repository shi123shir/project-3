const express = require('express')
const mongoose = require('mongoose')
const route = require('./route/route')
const app = express()

app.use(express.json())

mongoose.connect('mongodb+srv://shishir1912-DB:F85ml8mUXi1MrEKV@cluster0.2ta5zuw.mongodb.net/group36Database',
{useNewUrlParser: true})

.then(()=> console.log('MongoDB is connected'))
.catch(err => console.log(err))

app.use('/', route)

route.all('/*', function(req, res){
    res.status(400).send({status: false, message: 'Url Wrong'})
})

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
