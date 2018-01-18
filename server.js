const env = 'development';
const config = require('./knexfile.js')[env];
const knex = require('knex')(config);
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8000;
const AWS = require('aws-sdk');
const fileUpload = require('express-fileupload');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json({extended:true}));
// New Middleware!
app.use(fileUpload());
app.set('view engine', 'ejs');


AWS.config.loadFromPath('./config.json');
var s3Bucket = new AWS.S3({params: {Bucket: "demoimagesgalvanize"}});
const baseAWSURL = "https://s3-us-west-2.amazonaws.com/demoimagesgalvanize/"

app.get('/users', function(req, res){
  knex('users').then((results)=>{
    res.render('index', {users: results});
  })
});

app.post('/users', function(req, res) {
  console.log(req.body);
  console.log(req.files.upload);
  let uploadData = {
    Key: req.body.name,
    Body: req.files.upload.data,
    ContentType: req.files.upload.mimetype,
    ACL: 'public-read'
  }
  s3Bucket.putObject(uploadData, function(err, data){
    if(err){
      console.log(err);
      return;
    }

    knex('users').insert({
      name:req.body.name,
      email:req.body.email,
      image: baseAWSURL + uploadData.Key // We know that they key will be the end of the url
    }).then(()=>{
      res.redirect('/users');
    })
  });
});

app.listen(port, function () {
  console.log("running on localhost:"+port);
});
