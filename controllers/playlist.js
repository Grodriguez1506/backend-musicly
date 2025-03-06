import Playlist from "../models/playlist.js";
import Song from "../models/song.js";
import path from "path";
import fs from "fs";
import playlist from "../models/playlist.js";

const save = async (req, res) => {
  const name = req.body.name;
  const file = req.file;

  const ext = path.extname(file.filename);

  if (ext != ".jpg" && ext != ".png" && ext != ".jpeg" && ext != ".webp") {
    try {
      await fs.promises.unlink(path.join(file.destination, file.filename));

      return res.status(401).json({
        status: "error",
        message: "Extensión de archivo inválida",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Error al eliminar el archivo inválido",
      });
    }
  }

  if (!name || !file) {
    return res.status(401).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  try {
    const playlistFound = await Playlist.find({ name });

    if (playlistFound.length > 0) {
      await fs.promises.unlink(path.join(file.destination, file.filename));
      return res.status(401).json({
        status: "error",
        message: "El nombre ya existe",
      });
    }

    const playlistCreated = new Playlist({
      name,
      user: req.user.id,
      image: path.join(file.destination, file.filename),
    });

    await playlistCreated.save();

    return res.status(200).json({
      status: "success",
      message: "Playlist creada con éxito",
      playlist: playlistCreated,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error a crear playlist",
    });
  }
};

const remove = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      status: "error",
      message: "Se requiere un id para eliminar la playlist",
    });
  }

  try {
    const playlistDeleted = await Playlist.findOne({ _id: id, user: userId });

    console.log(playlistDeleted);

    if (!playlistDeleted) {
      return res.status(404).json({
        status: "error",
        message: "Playlist no encontrada",
      });
    }

    await playlistDeleted.deleteOne();

    await fs.promises.unlink(`./${playlistDeleted.image}`);

    return res.status(200).json({
      status: "success",
      message: "Playlist eliminada con éxito",
      playlist: playlistDeleted,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      status: "error",
      message: "Error al eliminar la playlist",
    });
  }
};

const edit = async (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  if (!id) {
    return res.status(401).json({
      status: "error",
      message: "Se requiere el id de la playlist a editar",
    });
  }

  if (!name) {
    return res.status(401).json({
      status: "error",
      message: "El campo nombre es un campo obligatorio",
    });
  }

  try {
    const playlistEdited = await Playlist.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!playlistEdited) {
      return res.status(404).json({
        status: "error",
        message: "La playlist no existe",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Playlist editada con éxito",
      playlist: playlistEdited,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Id no encontrado",
    });
  }
};

const addSong = async (req, res) => {
  const playlistId = req.params.id;
  const songId = req.body.id;

  if (!playlist) {
    return res.status(401).json({
      status: "error",
      message: "Se requiere el id de la playlist para agregar la canción",
    });
  }

  if (!songId) {
    return res.status(401).json({
      status: "error",
      message: "El campo canción es obligatorio",
    });
  }

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({
        status: "error",
        message: "Canción no encontrada",
      });
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        status: "error",
        message: "Playlist no encontrada",
      });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(400).json({
        status: "error",
        message: "La canción ya está en la playlist",
      });
    }

    playlist.songs.push(songId);
    await playlist.save();

    return res.status(200).json({
      status: "success",
      message: "Canción agregada a la playlist con éxito",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al agregar la canción",
    });
  }
};

const list = async (req, res) => {
  const user = req.user.id;

  const playlists = await Playlist.find({ user })
    .select("-user -__v")
    .populate({
      path: "songs",
      select: "-__v -created_at",
      populate: {
        path: "artist album",
        select: "name surname artisticName title description year",
      },
    });

  if (!playlists) {
    return res.status(404).json({
      status: "error",
      message: "No existen playlists creadas",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Estas son tus playlists",
    playlists,
  });
};

const one = async (req, res) => {
  const _id = req.params.id;
  const user = req.user.id;

  if (!_id) {
    return res.status(401).json({
      status: "error",
      message: "Debes suministrar el id de la playlist",
    });
  }

  try {
    const playlist = await Playlist.findOne({ _id, user })
      .select("-__v")
      .populate({ path: "user", select: "name surname username" })
      .populate({
        path: "songs",
        select: "-__v -created_at",
        populate: {
          path: "artist album",
          select: "name surname artisticName title description year",
        },
      });

    if (!playlist) {
      return res.status(404).json({
        status: "error",
        message: "No se encontró la playlist",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Playlist encontrada con éxito",
      playlist,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Id inválido",
    });
  }
};

const cover = async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(401).json({
      status: "error",
      message: "Debes suministrar el id de la playlist",
    });
  }

  try {
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({
        status: "error",
        message: "La playlist no existe",
      });
    }

    await fs.promises.stat(playlist.image);

    return res.status(200).sendFile(path.resolve(playlist.image));
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error en la búsqueda de la portada",
    });
  }
};

export default {
  save,
  remove,
  edit,
  addSong,
  list,
  one,
  cover,
};
