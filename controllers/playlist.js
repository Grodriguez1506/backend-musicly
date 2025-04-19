import Playlist from "../models/playlist.js";
import Song from "../models/song.js";
import path from "path";
import fs from "fs";

const save = async (req, res) => {
  const name = req.body.name;

  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "The picture is mandatory field",
    });
  }

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

  if (!name) {
    return res.status(401).json({
      status: "error",
      message: "Name field are mandatory",
    });
  }

  try {
    const playlistFound = await Playlist.find({ name });

    if (playlistFound.length > 0) {
      await fs.promises.unlink(path.join(file.destination, file.filename));
      return res.status(401).json({
        status: "error",
        message: "Name already exists",
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
      message: "The playlist has been created successfully",
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
  const playlistId = req.body.playlist;
  const songId = req.body.song;

  if (!playlistId) {
    return res.status(404).json({
      status: "error",
      message: "You have to select a valid playlist",
    });
  }

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({
        status: "error",
        message: "Song not found",
      });
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        status: "error",
        message: "Playlist not found",
      });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(200).json({
        status: "error",
        message: "The song is already in the playlist",
      });
    }

    playlist.songs.push(songId);
    await playlist.save();

    return res.status(200).json({
      status: "success",
      message: "Successfully included",
      playlist,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const deleteSong = async (req, res) => {
  const playlistId = req.body.playlist;
  const songId = req.body.song;

  if (!playlistId) {
    return res.status(404).json({
      status: "error",
      message: "You have to select a valid playlist",
    });
  }

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({
        status: "error",
        message: "Song not found",
      });
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        status: "error",
        message: "Playlist not found",
      });
    }

    if (!playlist.songs.includes(songId)) {
      return res.status(200).json({
        status: "error",
        message: "The song isn't in the playlist",
      });
    }

    const index = playlist.songs.indexOf(songId);
    playlist.songs.splice(index, 1);

    await playlist.save();

    return res.status(200).json({
      status: "success",
      message: "Successfully deleted",
      playlist,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const findBySong = async (req, res) => {
  const songId = req.params.song;
  try {
    const playlistsFound = await Playlist.find({ songs: songId });

    if (playlistsFound.length == 0) {
      return res.status(200).json({
        status: "error",
        message: "This song isn't in a playlist",
      });
    }

    return res.status(200).json({
      status: "success",
      playlists: playlistsFound,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const list = async (req, res) => {
  let user = req.user.id;

  if (req.params.id) {
    user = req.params.id;
  }

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

  if (playlists.length == 0) {
    return res.status(200).json({
      status: "error",
      message:
        "There's not playlists created, you can create a playlist on the following path Home > My Profile > Create Playlist",
    });
  }

  return res.status(200).json({
    status: "success",
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
  deleteSong,
  list,
  findBySong,
  one,
  cover,
};
