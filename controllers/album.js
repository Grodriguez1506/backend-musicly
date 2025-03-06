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
    populate: { path: "artist", select: "name surname artisticName" },
  };

  try {
    const albums = await Album.paginate({ artist: artistId }, options);

    if (page > albums.totalPages) {
      return res.status(400).json({
        status: "error",
        message: "Página inválida",
        totalSongs: albums.totalDocs,
        totalPages: albums.totalPages,
        page: albums.page,
      });
    }

    if (albums.docs.length < 1) {
      return res.status(404).json({
        status: "error",
        message:
          "No se han encontrado álbumes del artista seleccionado, valida el id suministrado",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lista de albumes",
      totalAlbums: albums.totalDocs,
      itemsPerPage: albums.limit,
      totalPages: albums.totalPages,
      currentPage: albums.page,
      albums: albums.docs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Se ha producido un error en la búsqueda",
    });
  }
};

export default {
  save,
  remove,
  edit,
  list,
};
