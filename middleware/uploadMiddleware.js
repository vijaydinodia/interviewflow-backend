const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Check if Cloudinary credentials are provided and valid
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "your_api_key";

let imageStorage;
let pdfStorage;
let cloudinary = null;

if (hasCloudinary) {
  cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "interviewflow/images",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
  });

  pdfStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "interviewflow/documents",
      allowed_formats: ["pdf"],
      resource_type: "raw",
    },
  });
} else {
  // Ensure local folders exist
  const imagesDir = path.join(__dirname, "../uploads/images");
  const docsDir = path.join(__dirname, "../uploads/documents");
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imagesDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `img_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`);
    },
  });

  pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, docsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `doc_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`);
    },
  });
}

// Multer instances with file validation
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WEBP, GIF) are allowed."));
    }
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

module.exports = { uploadImage, uploadPdf, cloudinary, hasCloudinary };
