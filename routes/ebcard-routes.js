const express = require("express");
const { check } = require("express-validator");

const cardControllers = require("../controllers/ebcard-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/", cardControllers.getCards);

router.get("/:ecid", cardControllers.getCardById);

router.use(checkAuth);

router.post("/favorites/:ecid", cardControllers.addFavCard);

router.post(
  "/:email",
  fileUpload.single("image"),
  [
    check("position").not().isEmpty(),
    check("company").not().isEmpty(),
    check("email").not().isEmpty(),
    check("tel").not().isEmpty(),
  ],
  cardControllers.createCard
);

router.patch("/status/:ecid", cardControllers.updateStatus);
  
router.patch(
  "/:ecid",
  [
    check("position").not().isEmpty(),
    check("company").not().isEmpty(),
    check("email").not().isEmpty(),
    check("tel").not().isEmpty(),
  ],
  cardControllers.updateCard
);

router.delete("/favorites/:ecid", cardControllers.removeFavCard);

router.delete("/:ecid", cardControllers.deleteCard);


module.exports = router;
