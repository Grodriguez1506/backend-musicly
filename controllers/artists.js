import Artist from "../models/artists.js";
import Song from "../models/song.js";
import Album from "../models/album.js";
import Follow from "../models/follow.js";
import validators from "../helpers/validate.js";
import bcrypt from "bcrypt";
import { createAccessToken } from "../helpers/jwt.js";
import path from "path";
import fs from "fs";

const register = async (req, res) => {
  let params = req.body;

  console.log(params);

  if (
    !params.name ||
    !params.artisticName ||
    !params.email ||
    !params.password
  ) {
    return res.status(404).json({
      status: "error",
      message: "Faltan datos por enviar",
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
        message: "El nombre de usuario ya existe",
      });
    }

    const emailFound = await Artist.findOne({ email: params.email });

    if (emailFound) {
      return res.status(400).json({
        status: "error",
        message: "El email ingresado ya existe",
      });
    }

    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    const newUser = new Artist(params);

    newUser.save({ new: true });

    return res.status(200).json({
      status: "success",
      message: "Artista registrado exitosamente",
      user: newUser,
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Error al registrar artista",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({
      status: "error",
      message: "Faltan datos por suministrar",
    });
  }

  try {
    const artistFound = await Artist.findOne({ email }).select(
      "+password +email"
    );

    if (!artistFound) {
      return res.status(404).json({
        status: "error",
        message: "Credenciales inválidas",
      });
    }

    const isMatch = await bcrypt.compare(password, artistFound.password);

    if (!isMatch) {
      return res.status(404).json({
        status: "error",
        message: "Credenciales inválidas",
      });
    }

    const token = createAccessToken(artistFound);

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });

    return res.status(200).json({
      status: "success",
      message: "Incio de sesión exitoso",
      artist: artistFound,
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      message: "Credenciales inválidas",
    });
  }
};

const profile = async (req, res) => {
  let artistIdentity = req.user;

  if (req.params.id) {
    artistIdentity = req.params.id;
  }

  try {
    const songs = await Song.countDocuments({ artist: artistIdentity.id });
    const albums = await Album.countDocuments({ artist: artistIdentity.id });
    const followers = await Follow.countDocuments({
      artist: artistIdentity.id,
    });

    return res.status(200).json({
      status: "success",
      message: "Perfil de artista",
      albums,
      songs,
      followers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "No se encontró el perfil del artista",
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
  res.clearCookie("access_token");

  return res.status(200).json({
    status: "error",
    message: "Cierre de sesión exitoso",
  });
};

export default {
  register,
  login,
  profile,
  uploadAvatar,
  logout,
};
