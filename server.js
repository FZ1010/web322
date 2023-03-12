/*********************************************************************************
 *  WEB322 – Assignment 4
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: Ali Zare Student ID: 150081214 Date: 03/12/2023
 *
 *  Online URL: viper-underwear.cyclic.app
 *
 ********************************************************************************/


var HTTP_PORT = process.env.PORT || 8080;
const { initialize, getAllPosts, getPublishedPosts, getCategories } = require("./blog-service.js");
var express = require("express");
const exphbs  = require('express-handlebars');
const Handlebars = require('handlebars');
const stripJs = require('strip-js');
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const upload = multer(); // no { storage: storage } since we are not using disk storage
const path = require("path");
const {addPost, getPostsByCategory, getPostsByMinDate, getPostById} = require("./blog-service");
const blogData = require("./blog-service");
var app = express();
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');


cloudinary.config({
    cloud_name: 'dfwfril7h',
    api_key: '447856318649477',
    api_secret: 'e__LN1-vFeXyJws_Kfzil15iVDk',
    secure: true
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

var safeHTML = function(context) {
    return stripJs(context);
};

Handlebars.registerHelper('navLink', function(url, options) {
    return '<li' + ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
});

Handlebars.registerHelper('safeHTML', safeHTML);


module.exports = {
    equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    }
}



// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {
    res.redirect("/blog");
});

app.get("/about", (req, res) => {
    res.render("about", {
        title: "About",
        description: "This is the about page"
    });
})

app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})

});

app.get("/posts", (req, res) => {
    if (req.query.category) {
        getPostsByCategory(req.query.category)
            .then((data) =>  res.render("posts", {posts: data}))
            .catch((err) => res.render("posts", {message: err}));
    }

    else if (req.query.minDate) {
        getPostsByMinDate(req.query.minDate)
            .then((data) => res.render("posts", {posts: data}))
            .catch((err) => res.render("posts", {message: err}));
    }

    else {
        getAllPosts()
            .then((data) => res.render("posts", {posts: data}))
            .catch((err) => res.render("posts", {message: err}));
    }
});

app.get("/post/:value", (req, res) => {
    getPostById(req.params.value)
        .then((data) => res.send(data))
        .catch((err) => res.send(err));
})

app.get("/posts/add", (req, res) => {
    res.render("addPost", {
        title: "addPost",
        description: "This is the add post page"
    });
})

app.get("/categories", (req, res) => {
    getCategories()
        .then((data) => res.render("categories", {categories: data}))
        .catch((err) => res.render("categories", {message: err}))
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

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        viewData.post = await blogData.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

app.use(function(req, res, next) {
    res.status(404);
    res.render('404');
});



// setup http server to listen on HTTP_PORT
initialize().then(() => {
    app.listen(HTTP_PORT, () =>
        console.log(`Express http server listening on ${HTTP_PORT}`)
    );
})