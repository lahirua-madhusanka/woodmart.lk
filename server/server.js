import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: env.nodeEnv });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seed", seedRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on port ${env.port}`);
});
