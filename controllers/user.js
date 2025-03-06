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
    const user = await User.findById(userIdentity.id);
    const artistFollowed = await Follow.countDocuments({
      user: userIdentity.id,
    });
    const userPlaylists = await Playlist.countDocuments({
      user: userIdentity.id,
    });

    return res.status(200).json({
      status: "success",
      message: "Bienvenido al perfil",
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
  const avatar = req.file.filename;

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
  logout,
};
