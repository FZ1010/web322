const fs = require("fs");
const path = require("path");

let posts = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "data", "posts.json"), "utf8", (err, postsData) => {
            if (err) reject("unable to read posts file");
            else {
                posts = JSON.parse(postsData);
                fs.readFile(path.join(__dirname, "data", "categories.json"), "utf8", (err, categoriesData) => {
                    if (err) reject("unable to read categories file");
                    else {
                        categories = JSON.parse(categoriesData);
                        resolve({ posts, categories });
                    }
                });
            }
        });
    });
}

function getAllPosts() {
    return new Promise((resolve, reject) => {
        if (posts.length === 0) reject("no results returned");
        else resolve(posts);
    });
}

function getPublishedPosts() {
    return new Promise((resolve, reject) => {
        const publishedPosts = posts.filter(post => post.published === true);
        if (publishedPosts.length === 0) reject("no results returned");
        else resolve(publishedPosts);
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) reject("no results returned");
        else resolve(categories);
    });
}

module.exports = { initialize, getAllPosts, getPublishedPosts, getCategories };
