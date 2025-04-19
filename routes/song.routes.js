import { Router } from "express";
import songController from "../controllers/song.js";
import { artistAccess } from "../middlewares/role.access.js";
import auth from "../middlewares/auth.js";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "./uploads/songs");
  },
  filename: (req, file, cb) => {
    const original = file.originalname.split(".");
    const filename = `${original[0]}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.${original[original.length - 1]}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

router.post(
  "/song/save",
  [auth, artistAccess, upload.single("song")],
  songController.save
);
router.put("/song/edit/:id?", [auth, artistAccess], songController.edit);
router.delete("/song/remove/:id?", [auth, artistAccess], songController.remove);
router.get("/song/list/:page?", auth, songController.list);
router.get("/song/list-by-artist/:id?", auth, songController.listByArtist);
router.get("/song/list-by-album/:id?", auth, songController.listByAlbum);
router.get("/song/likes/:id?", auth, songController.likes);
router.get("/song/search/:search?", auth, songController.search);
router.get("/song/media/:id?", auth, songController.media);
router.post("/song/like", auth, songController.like);
router.post("/song/dislike", auth, songController.dislike);

export default router;
