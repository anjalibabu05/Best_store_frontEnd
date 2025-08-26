const express = require('express');
const jsonServer = require('json-server');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Ensure public/images folder exists
const imageDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => {
    const image = Date.now() + "_" + file.originalname;
    req.body.image = `/images/${image}`; // <- store path for frontend
    cb(null, image);
  }
});
const upload = multer({ storage });

// Serve images statically
server.use('/images', express.static(imageDir));
server.use(middlewares);

// POST /products with image
server.post('/products', upload.single('image'), (req, res) => {
  try {
    if (req.body.price) req.body.price = Number(req.body.price);

    const errors = {};
    if (!req.body.name || req.body.name.length < 2) errors.name = "Name must be at least 2 characters";
    if (!req.body.brand || req.body.brand.length < 2) errors.brand = "Brand must be at least 2 characters";
    if (!req.body.category || req.body.category.length < 2) errors.category = "Category must be at least 2 characters";
    if (!req.body.price || req.body.price <= 0) errors.price = "Price must be greater than 0";
    if (!req.body.description || req.body.description.length < 10) errors.description = "Description must be at least 10 characters";
    if (!req.body.image) errors.image = "Image is required";

    if (Object.keys(errors).length > 0) return res.status(400).jsonp(errors);

    req.body.createdAt = new Date().toISOString();

    const db = router.db;
    const products = db.get('products');

    // Ensure 'image' field is stored
    const newProduct = {
      id: Date.now(),
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
      image: req.body.image, // <- standardized field
      createdAt: req.body.createdAt
    };

    products.push(newProduct).write();

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).send({ error: "Server error" });
  }
});

// Use JSON Server router for other routes
server.use(router);

server.listen(3000, () => console.log('JSON Server running with image upload on http://localhost:3000'));
