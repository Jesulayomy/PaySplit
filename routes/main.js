const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const { ensureAuth, ensureGuest } = require("../middleware/auth");
const path = require("path");

const { diskUpload, memoryUpload } = require("../middleware/multer");


router.get("/", homeController.getIndex);

router.get("/home", ensureAuth, homeController.getHomePage);
router.get("/users", homeController.getUsers);
router.get("/profile", ensureAuth, homeController.getProfile);
router.put("/profile", ensureAuth, diskUpload.single('image'), homeController.editProfile);
router.post("/receipt", memoryUpload.single('image'), ensureAuth, homeController.getReceipt);

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", diskUpload.single('image'), authController.postSignup);

module.exports = router;
