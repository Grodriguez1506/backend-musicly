import { Router } from "express";
import { artistAccess } from "../middlewares/role.access.js";
import auth from "../middlewares/auth.js";
import albumController from "../controllers/album.js";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "./uploads/albumCover");
  },
  filename: (req, file, cb) => {
    const original = file.originalname.split(".");
    const filename = `${original[0]}-${Date.now()}-${Math.round(
      Math.random() * 1e4
    )}.${original[original.length - 1]}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

router.post(
  "/album/save",
  [auth, artistAccess, upload.single("cover")],
  albumController.save
);
router.put(
  "/album/edit/:id?",
  [auth, artistAccess, upload.single("cover")],
  albumController.edit
);
router.delete(
  "/album/remove/:id?",
  [auth, artistAccess],
  albumController.remove
);
router.get("/album/list/:id?/:page?", auth, albumController.list);

export default router;
