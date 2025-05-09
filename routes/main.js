const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const { ensureAuth, ensureGuest } = require("../middleware/auth");


// const upload = require("../middleware/multer");

const multer = require('multer');
const upload = multer({storage: multer.memoryStorage()});

//Main Routes - simplified for now
router.get("/", homeController.getIndex);

router.get("/home", ensureAuth, homeController.getHomePage);
router.get("/users", homeController.getUsers);
router.get("/spend", ensureAuth, homeController.getSpend);
router.post("/receipt", upload.single('image'), ensureAuth, homeController.getReceipt);

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

module.exports = router;
