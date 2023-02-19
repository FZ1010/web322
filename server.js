/*********************************************************************************
 *  WEB322 – Assignment 2
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: Ali Zare Student ID: 150081214 Date: 02/19/2023
 *
 *  Online URL: web.fz1010.online
 *
 ********************************************************************************/


var HTTP_PORT = process.env.PORT || 8080;
const { initialize, getAllPosts, getPublishedPosts, getCategories } = require("./blog-service.js");
var express = require("express");
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const upload = multer(); // no { storage: storage } since we are not using disk storage
const path = require("path");
const {addPost, getPostsByCategory, getPostsByMinDate, getPostById} = require("./blog-service");
var app = express();

cloudinary.config({
    cloud_name: 'dfwfril7h',
    api_key: '447856318649477',
    api_secret: 'e__LN1-vFeXyJws_Kfzil15iVDk',
    secure: true
});

app.use(express.static(path.join(__dirname, 'public')));


// setup a 'route' to listen on the default url path
app.get("/", (req,res) =>
    res.redirect("/about")
);

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "about.html"));
})

app.get("/blog", (req, res) => {
    getPublishedPosts()
        .then((data) => res.send(data))
        .catch((err) => res.send(`message: ${err}`))
});

app.get("/posts", (req, res) => {
    if (req.query.category) {
        getPostsByCategory(req.query.category)
            .then((data) => res.send(data))
            .catch((err) => res.send(err));
    }

    else if (req.query.minDate) {
        getPostsByMinDate(req.query.minDate)
            .then((data) => res.send(data))
            .catch((err) => res.send(err));
    }

    else {
        getAllPosts()
            .then((data) => res.send(data))
            .catch((err) => res.send(err));
    }
});

app.get("/post/:value", (req, res) => {
    getPostById(req.params.value)
        .then((data) => res.send(data))
        .catch((err) => res.send(err));
})

app.get("/posts/add", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "addPost.html"));
})

app.get("/categories", (req, res) => {
    getCategories()
        .then((data) => res.send(data))
        .catch((err) => res.send(`message: ${err}`))
})

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream((error, result) => {
                if (result) resolve(result)
                else reject(error)
            });
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        return result;
    }

    upload(req)
        .then((uploaded) => {
            req.body.featureImage = uploaded.url;
            let postObject = {};
            postObject.body = req.body.body;
            postObject.title = req.body.title;
            postObject.postDate = Date.now();
            postObject.category = req.body.category;
            postObject.featureImage = req.body.featureImage;
            postObject.published = req.body.published;
            if (postObject.title) addPost(postObject);
            res.redirect("/posts");
        })
        .catch((err) => res.send(err));
});

app.get("/post/:value", (req, res) => {
    getPostById(req.params.value)
        .then((data) => res.send(data))
        .catch((err) => res.send(err));
})


app.use((req, res) =>
    res.status(404).send(`Page Not Found | ${res.statusCode}`)
)
// setup http server to listen on HTTP_PORT
initialize().then(() => {
    app.listen(HTTP_PORT, () =>
        console.log(`Express http server listening on ${HTTP_PORT}`)
    );
})