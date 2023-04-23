require('./db/config');
const cors = require('cors');
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-commerce';
const User = require('./db/user');
const Product = require('./db/product');
const express = require('express');

const app = express();

app.use(express.json())
app.use(cors())

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if(token) {
        token = token.split(' ')[1]
        Jwt.verify(token, jwtKey, (err, result) => {
            if(err) {
                res.status(401).send({result: "Please provide valid token in header"})
            } else {
                next()
            }
        })
        console.log(token)
    } else {
        res.status(403).send({result: "Please add token in header"})
    }
}

app.post('/register', async (req, res) => {
    let user = new User(req.body)
    let result = await user.save()
    result = result.toObject()
    delete result.password
    Jwt.sign({result}, jwtKey, {expiresIn:"2h"}, (err, token) =>{
        if(err) {
            res.send({result: "Something went wrong"})
        } else {
            res.send({result, token: token})
        }
    })
    // res.send(result)
})


app.post('/login', async (req, res) => {
    if(req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select("-password")
        if(user) {
            Jwt.sign({user}, jwtKey, {expiresIn:"2h"}, (err, token) =>{
                if(err) {
                    res.send({result: "Something went wrong"})
                } else {
                    res.send({user, token: token})
                }
            })
        } else {
            res.send({result: "Invalid Credentials"})
        }
    } else {
        res.send({result: "Invalid Credentials"})
    }
})

app.post('/add-product', verifyToken, async (req, res) => {
    let product = new Product(req.body)
    let result = await product.save()
    res.send(result)
})

app.get('/products', verifyToken, async (req, res) => {
    let product = await Product.find()
    if(product.length > 0) {
        res.send(product)
    } else {
        res.send({result: "No Products Found"})
    }
})

app.delete('/delete/:id', verifyToken, async (req, res) => {
    let id = req.params.id
    const result = await Product.deleteOne({_id: id})
    if(result) {
        res.send(result)
    } else {
        res.send({result: "Oops, something went wrong"})
    }
})

app.get('/product/:id', verifyToken, async (req, res) => {
    let product = await Product.findOne({_id: req.params.id})
    console.log(product)
    if(product) {
        res.send(product)
    } 
    else {
        res.send({result: "No Product Found"})
    }
})

app.put('/update-product/:id', verifyToken, async (req, res) => {
    let id = req.params.id
    let result = await Product.updateOne({_id: id}, {$set: req.body})
    if(result) {
        res.send(result)
    } else {
        res.send({result: "Oops, something went wrong"})
    }
})

app.get('/search/:key', verifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            {name: {$regex: req.params.key}},
            {price: {$regex: req.params.key}}
        ]
    })
    if(result.length > 0) {
        res.send(result)
    } else {
        res.send({result: "No Products Found"})
    }
})

app.listen(4200)