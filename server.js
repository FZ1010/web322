/*********************************************************************************
 *  WEB322 – Assignment 1
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: Ali Zare Student ID: 150081214 Date: 02/03/2023
 *
 *  Online URL: web.fz1010.online
 *
 ********************************************************************************/


var HTTP_PORT = process.env.PORT || 8080;
const { initialize, getAllPosts, getPublishedPosts, getCategories } = require("./blog-service.js");
var express = require("express");
const path = require("path");
var app = express();

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
    getAllPosts()
        .then((data) => res.send(data))
        .catch((err) => res.send(`message: ${err}`))
});

app.get("/categories", (req, res) => {
    getCategories()
        .then((data) => res.send(data))
        .catch((err) => res.send(`message: ${err}`))
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