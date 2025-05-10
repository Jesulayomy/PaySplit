const express = require("express");
const router = express.Router();
const contribController = require("../controllers/contributions");
const { ensureAuth, ensureGuest } = require("../middleware/auth");


router.get("/new", ensureAuth, contribController.newContribPage);
router.post("/new", ensureAuth, contribController.createContrib);

router.get("/:contributionID", ensureAuth, contribController.getContrib);
router.put("/:contributionID", ensureAuth, contribController.editContrib);
router.delete("/:contributionID", ensureAuth, contribController.deleteContrib);

router.get("/:contributionID/edit", ensureAuth, contribController.getContribEdit);
router.post("/:contributionID/pay", ensureAuth, contribController.payContrib);
router.post("/:contributionID/invite", ensureAuth, contribController.inviteToContrib);
router.post("/:contributionID/accept", ensureAuth, contribController.acceptContribInvite);
router.put("/:contributionID/complete", ensureAuth, contribController.completeContrib);


module.exports = router;
