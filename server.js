const express = require('express')
const path = require('path')
const crypto = require('crypto')//to generate file name
const mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const app = express()
const model = require('./model');

let conn = mongoose.connection;
let gfs;

conn.once('open', () => {
    //initialize our stream
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('imageUpload')
})

let storage = new GridFsStorage({
  url: "mongodb+srv://setpup:stepup@newsweb.mb9vg.mongodb.net/test?retryWrites=true&w=majority",
  file: (req, file) => {
      return new Promise(
          (resolve, reject) => {
                     const fileInfo = {
                  filename: file.originalname,
                  bucketName: "imageUpload"
              }
              resolve(fileInfo)

          }
      )
  }
})

const upload = multer({ storage })

app.post("/upload",upload.single("upload"),(req,res)=>{
  res.json({file:req.file})
})


app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
      //check if files exist
      if (!files || files.length == 0) {
          return res.status(404).json({
              err: "No files exist"
          })
      }
      // files exist
      return res.json(files)
  })
})

app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      //check if files exist
      if (!file || file.length == 0) {
          return res.status(404).json({
              err: "No files exist"
          })
      }
      //file exist
      return res.json(file)
  })
})

app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      //check if files exist
      console.log(file);
      if (!file || file.length == 0) {
          return res.status(404).json({
              err: "No files exist"
          })
      }
      //check if image
      if (file.contentType === 'image/jpeg' || file.contentType === "image/png") {
          //read output to browser
          const readStream = gfs.createReadStream(file.filename)
          readStream.pipe(res)
      } else {
          res.status(404).json({
              err: "Not an image"
          })
      }
  })
})

app.delete("/files/:id", (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'imageUpload' }, (err, gridStore) => {
      if (err) {
          return res.status(404).json({ err: err })
      }
      res.redirect("/")
  })
})


mongoose.connect("mongodb+srv://setpup:stepup@newsweb.mb9vg.mongodb.net/test?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true },()=>{
  console.log('db connnected')
})
app.listen(3000);