import Album from "../models/album.js";
import path from "path";
import fs from "fs";

const save = async (req, res) => {
  const file = req.file;
  const params = req.body;

  if (!file || Object.keys(params).length == 0) {
    return res.status(401).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  try {
    const albumFound = await Album.find({ title: params.title });

    if (!albumFound) {
      return res.status(404).json({
        status: "error",
        message: "Este álbum ya existe",
      });
    }

    const newAlbum = Album({
      artist: req.user.id,
      title: params.title,
      description: params.description,
      year: params.year,
      image: path.join(file.destination, file.filename),
    });

    await newAlbum.save();

    return res.status(200).json({
      status: "success",
      message: "Álbum creado con éxito",
      newAlbum,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al crear álbum",
    });
  }
};

const remove = async (req, res) => {
  const albumId = req.params.id;
  const artistId = req.user.id;

  if (!albumId) {
    return res.status(400).json({
      status: "error",
      message: "Se requiere un ID para eliminar el álbum",
    });
  }

  try {
    const albumDeleted = await Album.findOne({
      _id: albumId,
      artist: artistId,
    });

    if (!albumDeleted) {
      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado",
      });
    }

    await albumDeleted.deleteOne();

    await fs.promises.unlink(`./${albumDeleted.image}`);

    return res.status(200).json({
      status: "success",
      message: "Álbum eliminado con éxito",
      albumDeleted,
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      message: "Error al eliminar el álbum",
    });
  }
};

const edit = async (req, res) => {
  let params = req.body;
  const albumId = req.params.id;

  if (!albumId) {
    return res.status(401).json({
      status: "error",
      message: "Proporciona el id del álbum a editar",
    });
  }

  if (!params.title) {
    delete params.title;
  }

  if (!params.description) {
    delete params.description;
  }

  if (!params.year) {
    delete params.year;
  }

  if (req.file) {
    const file = req.file;
    params.image = path.join(file.destination, file.filename);
  }

  try {
    const albumEdited = await Album.findByIdAndUpdate(albumId, params, {
      new: true,
    });

    if (!albumEdited) {
      return res.status(404).json({
        status: "error",
        message: "No se encontró el álbum",
      });
    }

    albumEdited.save();

    return res.status(200).json({
      status: "success",
      message: "Álbum editado exitosamente",
      albumEdited,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error en la edición, valida los datos suministrados",
    });
  }
};

const listByArtist = async (req, res) => {
  let artist = req.params.id;

  try {
    const albums = await Album.find({ artist });

    return res.status(200).json({
      status: "success",
      albums,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const media = async (req, res) => {
  const albumId = req.params.id;

  const album = await Album.findById(albumId);

  const filePath = path.resolve(album.image);

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

export default {
  save,
  remove,
  edit,
  listByArtist,
  media,
};
