export const artistAccess = (req, res, next) => {
  const role = req.user.role;

  if (role != "artist_role") {
    return res.status(400).json({
      status: "error",
      message: "Tu rol no te permite acceder a las funciones de artista",
    });
  }

  next();
};

export const userAccess = (req, res, next) => {
  const role = req.user.role;

  if (role != "user_role") {
    return res.status(400).json({
      status: "error",
      message: "Tu rol no te permite acceder a las funciones de usuario",
    });
  }

  next();
};
