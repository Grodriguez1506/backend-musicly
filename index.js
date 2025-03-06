import express from "express";
import "dotenv/config";
import connectDb from "./database/db.js";
import userRoutes from "./routes/user.routes.js";
import artistRoutes from "./routes/artists.routes.js";
import songRoutes from "./routes/song.routes.js";
import albumRoutes from "./routes/album.routes.js";
import followRoutes from "./routes/follow.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

// Inicializar express mediante la constante app
const app = express();

// Definir el puerto
const port = process.env.PORT || 3900;

// Conectar a la BD
connectDb();

// Configuración para procesar los datos en JSON
app.use(express.json());

// Configuración para procesar los datos enviados desde un formulario
app.use(express.urlencoded({ extended: true }));

// Configuración para acceder a las cookies
app.use(cookieParser());

// Configurar el CORS para permitir el frontend
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Utilizar rutas desde el el directorio Routes
app.use("/api", userRoutes);
app.use("/api", artistRoutes);
app.use("/api", songRoutes);
app.use("/api", albumRoutes);
app.use("/api", followRoutes);
app.use("/api", playlistRoutes);

app.listen(port, () => {
  console.log("App running on port", port);
});
