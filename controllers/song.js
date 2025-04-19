import Song from "../models/song.js";
import path from "path";
import fs from "fs";

const save = async (req, res) => {
  const file = req.file;
  const params = req.body;

  if (!file || !params.name) {
    return res.status(401).json({
      status: "error",
      message: "Both fields are mandatory",
    });
  }

  const ext = path.extname(file.filename);
  if (ext != ".mp3" && ext != ".ogg") {
    try {
      await fs.promises.unlink(`${file.destination}/${file.filename}`);

      return res.status(400).json({
        status: "error",
        message: "Invalid extension",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Something went wrong trying to delete the file",
      });
    }
  }

  const newSong = new Song({
    name: params.name,
    artist: req.user.id,
    file: file.filename,
  });

  try {
    await newSong.save();

    return res.status(200).json({
      status: "success",
      message: "Song uploaded successfully",
      song: newSong,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const edit = async (req, res) => {
  const params = req.body;
  const songId = req.params.id;

  if (!songId) {
    return res.status(401).json({
      status: "error",
      message: "Proporciona el id de la canción a editar",
    });
  }

  if (!params.name) {
    delete params.name;
  }

  if (!params.album) {
    delete params.album;
  }

  if (!params.track) {
    delete params.track;
  }

  try {
    const songEdited = await Song.findByIdAndUpdate(songId, params, {
      new: true,
    });

    if (!songEdited) {
      return res.status(404).json({
        status: "error",
        message: "No se encontró la canción",
      });
    }

    songEdited.save();

    return res.status(200).json({
      status: "success",
      message: "Canción editada exitosamente",
      songEdited,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error en la edición, valida los datos suministrados",
    });
  }
};

const remove = async (req, res) => {
  const songId = req.params.id;

  if (!songId) {
    return res.status(400).json({
      status: "error",
      message: "Se requiere un ID para eliminar la canción",
    });
  }

  try {
    const songDeleted = await Song.findByIdAndDelete(songId);

    if (!songDeleted) {
      return res.status(404).json({
        status: "error",
        message: "Canción no encontrada",
      });
    }

    await fs.promises.unlink(
      path.join("./", "uploads", "songs", songDeleted.file)
    );

    return res.status(200).json({
      status: "success",
      message: "Canción eliminada con éxito",
      songDeleted,
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      message: "Error al eliminar la canción",
    });
  }
};

const list = async (req, res) => {
  let page;

  if (!req.params.page) {
    page = 1;
  } else {
    page = req.params.page;
  }

  const options = {
    page,
    limit: 5,
    select: "-__v",
    populate: [
      { path: "artist", select: "-__v -role" },
      { path: "album", select: "-__v" },
    ],
  };

  try {
    const songs = await Song.paginate({}, options);

    if (page > songs.totalPages) {
      return res.status(400).json({
        status: "error",
        message: "Página inválida",
        totalSongs: songs.totalDocs,
        totalPages: songs.totalPages,
        page: songs.page,
      });
    }

    if (songs.docs.length < 1) {
      return res.status(404).json({
        status: "error",
        message: "There isn't songs yet",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Songs list",
      totalSongs: songs.totalDocs,
      itemsPerPage: songs.limit,
      totalPages: songs.totalPages,
      currentPage: songs.page,
      songs: songs.docs,
      prev: songs.hasPrevPage,
      next: songs.hasNextPage,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const listByArtist = async (req, res) => {
  const artist = req.params.id;

  try {
    const songsFound = await Song.find({ artist })
      .select("-__v")
      .populate("artist", "-__v -role")
      .populate("album", "-__v");

    if (songsFound.length == 0) {
      return res.status(200).json({
        status: "error",
        message: "Artist doesn't have songs yet",
      });
    }

    return res.status(200).json({
      status: "success",
      songs: songsFound,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong whit list",
    });
  }
};

const listByAlbum = async (req, res) => {
  const album = req.params.id;

  try {
    const songsFound = await Song.find({ album })
      .select("-__v")
      .populate("artist", "-__v -role")
      .populate("album", "-__v");

    if (songsFound.length == 0) {
      return res.status(200).json({
        status: "error",
        message: "Album doesn't have songs yet",
      });
    }

    return res.status(200).json({
      status: "success",
      songs: songsFound,
    });
  } catch (error) {
    return res.staus(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const likes = async (req, res) => {
  const song = req.params.id;

  try {
    const songFound = await Song.findById(song).populate("likes", "-__v -role");

    return res.status(200).json({
      status: "success",
      likes: songFound.likes,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const search = async (req, res) => {
  const search = req.params.search;

  try {
    const songsFound = await Song.find({
      name: { $regex: search, $options: "i" },
    }).populate("artist", "-__v -role");

    if (songsFound.length == 0) {
      return res.status(200).json({
        status: "success",
        message: "There aren't songs with this name",
      });
    }

    return res.status(200).json({
      status: "success",
      songs: songsFound,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const media = async (req, res) => {
  const songId = req.params.id;

  const song = await Song.findById(songId);

  const filePath = path.resolve(path.join("./uploads", "songs", song.file));

  fs.stat(filePath, (error, song) => {
    if (error || !song) {
      return res.status(404).json({
        status: "error",
        message: "Something went wrong",
      });
    }

    return res.status(200).sendFile(filePath);
  });
};

const like = async (req, res) => {
  const id = req.user.id;
  const { song } = req.body;

  try {
    const songFound = await Song.findById(song);

    if (songFound.likes.includes(id)) {
      return res.status(400).json({
        status: "error",
        message: "You already like it this song",
      });
    }

    songFound.likes.push(id);
    await songFound.save();

    return res.status(200).json({
      status: "success",
      likes: songFound.likes,
      song: songFound,
    });
  } catch (error) {}
};

const dislike = async (req, res) => {
  const user = req.user.id;
  const song = req.body.song;

  try {
    const songFound = await Song.findById(song);

    if (!songFound) {
      return res.status(404).json({
        status: "error",
        message: "The song doesn't exist",
      });
    }

    const index = songFound.likes.indexOf(user);

    songFound.likes.splice(index, 1);

    await songFound.save();

    return res.status(200).json({
      status: "success",
      likes: songFound.likes,
      song: songFound,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export default {
  save,
  edit,
  remove,
  list,
  listByArtist,
  listByAlbum,
  likes,
  search,
  media,
  like,
  dislike,
};
