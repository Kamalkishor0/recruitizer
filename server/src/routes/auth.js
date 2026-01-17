import { Router } from "express";
import {
  renderSignin,
  renderSignup,
  signin,
  signup,
  logout,
  me,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.get("/signin", renderSignin);
router.get("/signup", renderSignup);
router.post("/signin", signin);
router.post("/signup", signup);
router.get("/logout", logout);
router.get("/me", authenticate, me);

export default router;

