import { Router } from "express";
import followControllers from "../controllers/follow.js";
import auth from "../middlewares/auth.js";
import { userAccess } from "../middlewares/role.access.js";

const router = Router();

router.post("/follow/save", [auth, userAccess], followControllers.save);
router.delete(
  "/follow/unfollow",
  [auth, userAccess],
  followControllers.unfollow
);
router.get(
  "/follow/followed-artist/:id?",
  auth,
  followControllers.followedArtists
);
router.get("/follow/feed", auth, followControllers.feed);

export default router;
