import Artist from "../models/artists.js";
import Song from "../models/song.js";
import Album from "../models/album.js";
import Follow from "../models/follow.js";
import jwt from "jsonwebtoken";
import validators from "../helpers/validate.js";
import bcrypt from "bcrypt";
import {
  createAccessToken,
  createRefreshToken,
  createNewAccesToken,
} from "../helpers/jwt.js";
import path from "path";
import fs, { stat } from "fs";
import { getRootPath } from "../rootpath.js";

const register = async (req, res) => {
  let params = req.body;

  if (
    !params.name ||
    !params.artisticName ||
    !params.email ||
    !params.password
  ) {
    return res.status(404).json({
      status: "error",
      message: "Name, artistic name, email and password are mandatory fields",
    });
  }

  try {
    validators.validateRegister(params);
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }

  try {
    const usernameFound = await Artist.findOne({
      artisticName: params.artisticName,
    });

    if (usernameFound) {
      return res.status(400).json({
        status: "error",
        message: "Artistic name already exists",
      });
    }

    const emailFound = await Artist.findOne({ email: params.email });

    if (emailFound) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    const newUser = new Artist(params);

    newUser.save({ new: true });

    return res.status(200).json({
      status: "success",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({
      status: "error",
      message: "Both fields are mandatory",
    });
  }

  try {
    const artistFound = await Artist.findOne({ email }).select(
      "+password +email"
    );

    if (!artistFound) {
      return res.status(404).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, artistFound.password);

    if (!isMatch) {
      return res.status(404).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const refreshToken = createRefreshToken(artistFound);
    const token = createAccessToken(artistFound);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Expira en 7 días
    });

    return res.status(200).json({
      token,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(403).json({ message: "There's not refresh token" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: "error",
        message: "Refresh token expired, please login again",
      });
    }

    const newAccessToken = createNewAccesToken(user);

    return res.json({
      status: "success",
      token: newAccessToken,
    });
  });
};

const profile = async (req, res) => {
  let artistIdentity = req.user;

  if (req.params.id) {
    artistIdentity = req.params.id;
  }

  try {
    const artist = await Artist.findById(artistIdentity.id).select(
      "-__v -role"
    );

    return res.status(200).json({
      status: "success",
      message: "Artist profile",
      artist,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "No se encontró el perfil del artista",
    });
  }
};

const search = async (req, res) => {
  const search = req.params.search;
  const user = req.user.id;

  try {
    const artistsFound = await Artist.find({
      artisticName: { $regex: search, $options: "i" },
    });

    if (artistsFound.length == 0) {
      return res.status(200).json({
        status: "success",
        message: "There aren't artists with this name",
      });
    }

    const following = await Follow.find({ user });

    let follows = [];

    following.forEach((follow) => {
      follows.push(follow.artist);
    });

    return res.status(200).json({
      status: "success",
      artists: artistsFound,
      follows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const avatar = async (req, res) => {
  const file = req.params.file;
  if (!file) {
    return res.status(404).json({
      status: "error",
      message: "The file in the URL is mandatory",
    });
  }
  try {
    const artistFound = await Artist.findOne({ avatar: file });
    if (!artistFound) {
      return res.status(404).json({
        status: "error",
        message: "The file doesn't exist",
      });
    }

    const rootPath = getRootPath();
    const filename = artistFound.avatar;
    const filePath = path.join(rootPath, "uploads", "avatar", filename);

    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const list = async (req, res) => {
  const user = req.user.id;

  try {
    const artistsFound = await Artist.find().select("-__v -role");

    if (artistsFound.length == 0) {
      return res.status(200).json({
        status: "success",
        message: "There aren't artists registered yet",
      });
    }

    const following = await Follow.find({ user });

    let follows = [];

    following.forEach((follow) => {
      follows.push(follow.artist);
    });

    return res.status(200).json({
      status: "success",
      artists: artistsFound,
      follows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const uploadAvatar = async (req, res) => {
  const artistId = req.user.id;
  const avatar = req.file.filename;

  if (!req.file) {
    return res.status(401).json({
      status: "error",
      message: "El campo archivo es obligatorio",
    });
  }

  const ext = path.extname(avatar);
  if (ext != ".jpg" && ext != ".png" && ext != ".jpeg") {
    try {
      await fs.promises.unlink(`${req.file.destination}/${req.file.filename}`);

      return res.status(400).json({
        status: "error",
        message: "Extensión de archivo inválida",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Error al intentar borrar el archivo",
      });
    }
  }

  try {
    const avatarUpload = await Artist.findByIdAndUpdate(
      artistId,
      { avatar },
      { new: true }
    );

    avatarUpload.save();
    return res.status(200).json({
      status: "success",
      message: "Actualización de foto de perfil exitosa",
      artist: avatarUpload,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al cargar foto de perfil",
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken");

  return res.status(200).json({
    status: "error",
    message: "Loged out successfully",
  });
};

export default {
  register,
  list,
  login,
  refresh,
  profile,
  uploadAvatar,
  avatar,
  search,
  logout,
};
