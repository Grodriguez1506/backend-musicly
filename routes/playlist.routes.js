import { Router } from "express";
import playlistController from "../controllers/playlist.js";
import auth from "../middlewares/auth.js";
import { userAccess } from "../middlewares/role.access.js";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "./uploads/playlistCover");
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
  "/playlist/save",
  [auth, userAccess, upload.single("image")],
  playlistController.save
);
router.delete(
  "/playlist/remove/:id?",
  [auth, userAccess],
  playlistController.remove
);
router.put("/playlist/edit/:id?", [auth, userAccess], playlistController.edit);
router.post(
  "/playlist/add-song",
  [auth, userAccess],
  playlistController.addSong
);
router.delete(
  "/playlist/delete-song",
  [auth, userAccess],
  playlistController.deleteSong
);
router.get("/playlist/list", [auth, userAccess], playlistController.list);
router.get("/playlist/one/:id?", [auth, userAccess], playlistController.one);
router.get("/playlist/cover/:id?", playlistController.cover);
router.get(
  "/playlist/find-by-song/:song?",
  [auth, userAccess],
  playlistController.findBySong
);

export default router;
