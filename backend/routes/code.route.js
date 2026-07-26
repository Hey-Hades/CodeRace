import express from "express";
import { executeCode, runSampleCode } from "../controllers/code.controller.js";

const router = express.Router();

router.post("/execute", executeCode);
router.post("/run", runSampleCode);

export default router;

