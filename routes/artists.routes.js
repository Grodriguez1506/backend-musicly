import { Router } from "express";
import artistController from "../controllers/artists.js";
import { artistAccess } from "../middlewares/role.access.js";
import auth from "../middlewares/auth.js";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "./uploads/avatar");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `artist-avatar-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

router.post("/artist/register", artistController.register);
router.post("/artist/login", artistController.login);
router.post("/artist/refresh", artistController.refresh);
router.get("/artist/profile/:id?", auth, artistController.profile);
router.post(
  "/artist/upload",
  [auth, artistAccess, upload.single("avatar")],
  artistController.uploadAvatar
);
router.get("/artist/avatar/:file?", artistController.avatar);
router.get("/artist/search/:search?", auth, artistController.search);
router.post("/artist/logout", artistController.logout);
router.get("/artist/list", auth, artistController.list);

export default router;
