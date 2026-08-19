const express = require("express");
const router  = express.Router();
const { auth } = require("../middleware/auth");
const { uploadImage, uploadPdf } = require("../middleware/uploadMiddleware");
const uploadController = require("../controller/uploadController");

// POST /upload/image — Upload image (avatar, company logo)
// Field name in form-data must be "image"
router.post(
  "/image",
  auth,
  uploadImage.single("image"),
  uploadController.uploadImage
);

// POST /upload/pdf — Upload PDF (resume, verification doc)
// Field name in form-data must be "pdf"
router.post(
  "/pdf",
  auth,
  uploadPdf.single("pdf"),
  uploadController.uploadPdf
);

module.exports = router;
