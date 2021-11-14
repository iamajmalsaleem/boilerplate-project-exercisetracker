const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const bodyParser = require('body-parser')
const mySecret = process.env['trc']

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
//SCHEMA & MODEL
let { Schema } = mongoose

let addSchema = new Schema({
  description:{ type: String, required: true },
  duration:{ type: Number, required: true },
  date : String
})

let userSchema = new Schema({
  username: { type: String, required: true },
  log: [addSchema]
  //, count: Number
 
})

let addModel = mongoose.model('add', addSchema)
let userModel = mongoose.model('exercises', userSchema)

//POST username

let trkObj = {}

app.post("/api/users", bodyParser.urlencoded({ extended: false }), (req, response) => {

  let input = req.body.username
  trkObj['username'] = input


  userModel.create({ username: input }, (err, res) => {
    if (!err) {
      trkObj['_id'] = res._id
      response.json(trkObj)
    }
  })

})

//GET users

app.get("/api/users", (req, response) => {
  userModel.find({})
  .select("_id")
  .select('username')
  .exec((err,res)=>{
    if(!err && res!=undefined){
      response.json(res)
    }
  })
})

//POST exercise

app.post("/api/users/:id/exercises", bodyParser.urlencoded({ extended: false }), (req, response) =>{

       if(!req.body.duration) response.json({error:"duration is must"})
      else if(!req.body.description) response.json({error:"description is must"})
else{
let newEx = new addModel({
  description: req.body.description,
  duration: parseInt(req.body.duration),
  date: req.body.date
})  

if(newEx.date==""){
  newEx.date=new Date().toISOString().substring(0, 10)
}

userModel.findByIdAndUpdate(
  req.body._id,
  {$push:{log:newEx}},
  {new:true},
  (err,data)=>{
    if(!err && data!=undefined){
      let dataObj={}
      dataObj['username']=data.username
      dataObj['description']=newEx.description   
      dataObj['duration']=newEx.duration
      dataObj['date']=new Date(newEx.date).toDateString()
      dataObj['_id']=data._id
     
      response.json(dataObj)
    }
    else response.json({data:"not found"})
  })
     }
})

//GET full log

app.get("/api/users/:id/logs",(req,response)=>{
let inputId = req.params.id
userModel.findOne({ _id: inputId })
.select("_id")
.select('username')
.select("count")
.select('log')
.exec((err,res)=>{
  if(!err && res!=undefined){
    res = res.toJSON()
    res['count']=res.log.length
    response.json(res)
  } else {response.json({error:"NOT FOUND"})}
})
})