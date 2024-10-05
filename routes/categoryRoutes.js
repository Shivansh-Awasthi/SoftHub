const express = require('express');
const { createCategory, getCategories } = require("../controllers/categoryControllers");
const router = express.Router();


router.post("/new", createCategory);
router.get("/all", getCategories);



module.exports = router;