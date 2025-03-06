import Song from "../models/song.js";
import path from "path";
import fs from "fs";

const save = async (req, res) => {
  const file = req.file;
  const params = req.body;

  if (!file || !params.name) {
    return res.status(401).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  const ext = path.extname(file.filename);
  if (ext != ".mp3" && ext != ".ogg") {
    try {
      await fs.promises.unlink(`${file.destination}/${file.filename}`);

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

  const newSong = new Song({
    name: params.name,
    artist: req.user.id,
    file: file.filename,
  });

  try {
    await newSong.save();

    return res.status(200).json({
      status: "success",
      message: "Canción cargada exitosamente",
      song: newSong,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Error al cargar la canción",
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
  let artistId = req.user.id;
  let page = 1;

  if (req.params.id) {
    if (!isNaN(req.params.id)) {
      page = req.params.id;
    } else {
      artistId = req.params.id;
    }
  }

  if (req.params.page) {
    page = req.params.page;
  }

  const options = {
    page,
    limit: 5,
    select: "-__v",
    populate: [
      { path: "artist", select: "name surname artisticName" },
      { path: "album", select: "-image -__v -artist" },
    ],
  };

  try {
    const songs = await Song.paginate({ artist: artistId }, options);

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
        message:
          "No se han encontrado canciones del artista seleccionado, valida el id suministrado",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lista de canciones",
      totalSongs: songs.totalDocs,
      itemsPerPage: songs.limit,
      totalPages: songs.totalPages,
      currentPage: songs.page,
      songs: songs.docs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Se ha producido un error en la búsqueda",
    });
  }
};

const media = async (req, res) => {
  const file = req.params.file;

  const song = await Song.findById(file);

  const filePath = path.resolve(path.join("./uploads", "songs", song.file));

  fs.stat(filePath, (error, song) => {
    if (error || !song) {
      return res.status(200).json({
        status: "error",
        message: "La canción no existe",
      });
    }

    return res.status(200).sendFile(filePath);
  });
};

export default {
  save,
  edit,
  remove,
  list,
  media,
};
