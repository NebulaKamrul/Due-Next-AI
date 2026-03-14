import { Router, type IRouter } from "express";
import healthRouter from "./health";
import syllabusRouter from "./syllabus";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/syllabus", syllabusRouter);

export default router;
