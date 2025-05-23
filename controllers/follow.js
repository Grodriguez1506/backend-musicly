import Artist from "../models/artists.js";
import Follow from "../models/follow.js";
import Song from "../models/song.js";
import Album from "../models/album.js";
import album from "../models/album.js";
import song from "../models/song.js";

const save = async (req, res) => {
  const artist = req.body.artist;
  const user = req.user.id;

  if (!artist) {
    return res.status(404).json({
      status: "error",
      message: "Se requiere suministrar el id para seguir al artista",
    });
  }

  try {
    const artistFound = await Artist.findById(artist);
    if (!artistFound) {
      return res.status(400).json({
        status: "error",
        message: "Artista no encontrado",
      });
    }

    const followValidation = await Follow.findOne({ user, artist });

    if (followValidation) {
      return res.status(400).json({
        status: "error",
        message: "Ya sigues a este artista",
      });
    }

    const newFollow = new Follow({
      user,
      artist,
    });

    await newFollow.save();

    const artistFollowed = await Follow.findById(newFollow._id)
      .populate("artist", "name surname artisticName")
      .populate("user", "name surname username")
      .select("-__v");

    return res.status(200).json({
      status: "success",
      message: "Artist followed successfully",
      artistFollowed,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al seguir artista",
    });
  }
};

const unfollow = async (req, res) => {
  const artist = req.body.id;
  const user = req.user.id;

  if (!artist) {
    return res.status(404).json({
      status: "error",
      message: "Se requiere suministrar el id para dejar de seguir al artista",
    });
  }

  try {
    const artistFound = await Artist.findById(artist);
    if (!artistFound) {
      return res.status(400).json({
        status: "error",
        message: "El artista no existe",
      });
    }

    const followValidation = await Follow.findOne({ user, artist });

    if (!followValidation) {
      return res.status(400).json({
        status: "error",
        message: "No sigues a este artista",
      });
    }

    await followValidation.deleteOne();

    return res.status(200).json({
      status: "success",
      message: "Artist unfollowed successfully",
      followDeleted: followValidation,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Error al eliminar artista",
    });
  }
};

const followedArtists = async (req, res) => {
  var userId = req.user.id;

  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    const artists = await Follow.find({ user: userId });

    if (artists.length == 0) {
      return res.status(200).json({
        status: "error",
        message: "The user has not followed artists",
      });
    }
    return res.status(200).json({
      status: "success",
      followedArtists: artists,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const feed = async (req, res) => {
  const user = req.user.id;

  try {
    const follows = await Follow.find({ user });

    if (follows.length == 0) {
      return res.status(200).json({
        status: "error",
        message: "There aren't followed artists",
      });
    }

    let artists = [];

    follows.forEach((follow) => {
      artists.push(follow.artist);
    });

    const songsFound = await Song.find({ artist: artists }).populate(
      "artist",
      "-__v -role"
    );

    let songs = [];

    songsFound.forEach((song) => {
      let songObj = song.toObject();
      songObj.type = "song";
      songs.push(songObj);
    });

    const albumsFound = await Album.find({ artist: artists }).populate(
      "artist",
      "-__v -role"
    );

    let albums = [];

    albumsFound.forEach((album) => {
      let albumObj = album.toObject();
      albumObj.type = "album";
      albums.push(albumObj);
    });

    let feed = [...songs, ...albums];

    feed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      status: "success",
      feed,
    });
  } catch (error) {
    console.log(error);
  }
};

export default {
  save,
  unfollow,
  followedArtists,
  feed,
};
