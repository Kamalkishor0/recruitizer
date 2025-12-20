import { Router } from "express";
import {
  renderSignin,
  renderSignup,
  signin,
  signup,
  logout,
} from "../controllers/authController.js";

const router = Router();

router.get("/signin", renderSignin);
router.get("/signup", renderSignup);
router.post("/signin", signin);
router.post("/signup", signup);
router.get("/logout", logout);

export default router;

