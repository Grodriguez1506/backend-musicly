import User from "../models/user.js";
import Follow from "../models/follow.js";
import Playlist from "../models/playlist.js";
import validators from "../helpers/validate.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createAccessToken,
  createRefreshToken,
  createNewAccesToken,
} from "../helpers/jwt.js";
import user from "../models/user.js";
import { getRootPath } from "../rootpath.js";
import path from "path";
import fs from "fs";

const register = async (req, res) => {
  let params = req.body;

  if (!params.name || !params.username || !params.email || !params.password) {
    return res.status(404).json({
      status: "error",
      message: "Name, username, email and password are mandatory fields",
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
    const usernameFound = await User.findOne({ username: params.username });

    if (usernameFound) {
      return res.status(400).json({
        status: "error",
        message: "The username already exists",
      });
    }

    const emailFound = await User.findOne({ email: params.email });

    if (emailFound) {
      return res.status(400).json({
        status: "error",
        message: "The email already exists",
      });
    }

    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    const newUser = new User(params);

    newUser.save({ new: true });

    return res.status(200).json({
      status: "success",
      message: "User registered succesfully",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al registrar usuario",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({
      status: "error",
      message: "Email and password are mandatory fields",
    });
  }

  try {
    const userFound = await User.findOne({ email }).select("+password +email");

    if (!userFound) {
      return res.status(404).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);

    if (!isMatch) {
      return res.status(404).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const refreshToken = createRefreshToken(userFound);
    const token = createAccessToken(userFound);

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
    console.log(error);
    return res.status(404).json({
      status: "error",
      message: "Invalid credentials",
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
        message: "Expired token",
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
  const userIdentity = req.user;

  try {
    const user = await User.findById(userIdentity.id).select("-__v -role");
    const artistFollowed = await Follow.countDocuments({
      user: userIdentity.id,
    });
    const userPlaylists = await Playlist.countDocuments({
      user: userIdentity.id,
    });

    return res.status(200).json({
      status: "success",
      message: "Welcome to profile",
      user,
      artistFollowed,
      playlists: userPlaylists,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const uploadAvatar = async (req, res) => {
  const userId = req.user.id;
  const file = req.file;
  const avatar = file.filename;

  const ext = avatar.split(".");

  if (
    ext[ext.length - 1] != "png" &&
    ext[ext.length - 1] != "jpg" &&
    ext[ext.length - 1] != "jpeg"
  ) {
    fs.unlink(path.join(file.destination, avatar), (error) => {
      if (error) {
        return res.status(500).json({
          status: "error",
          message: "Something went wrong",
        });
      }
    });

    return res.status(400).json({
      status: "error",
      message: "File extension must be .jpg .png .jpeg",
    });
  }

  try {
    const avatarUpload = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    );

    avatarUpload.save();
    return res.status(200).json({
      status: "success",
      message: "Actualización de foto de perfil exitosa",
      user: avatarUpload,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al cargar foto de perfil",
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
    const userFound = await user.findOne({ avatar: file });
    if (!userFound) {
      return res.status(404).json({
        status: "error",
        message: "The file doesn't exist",
      });
    }

    const rootPath = getRootPath();
    const filename = userFound.avatar;
    const filePath = path.join(rootPath, "uploads", "avatar", filename);

    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken");

  return res.status(200).json({
    status: "success",
    message: "Cierre de sesión exitoso",
  });
};

export default {
  register,
  login,
  refresh,
  profile,
  uploadAvatar,
  avatar,
  logout,
};
