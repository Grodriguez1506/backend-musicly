import { Router } from "express";
import followControllers from "../controllers/follow.js";
import auth from "../middlewares/auth.js";
import { userAccess } from "../middlewares/role.access.js";

const router = Router();

router.post("/follow/save/:id?", [auth, userAccess], followControllers.save);
router.delete(
  "/follow/unfollow/:id?",
  [auth, userAccess],
  followControllers.unfollow
);
router.get(
  "/follow/followed-artist/:id?",
  auth,
  followControllers.followedArtists
);

export default router;
