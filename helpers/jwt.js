import jwt from "jsonwebtoken";
import moment from "moment";

export const createAccessToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    username: user.username,
    email: user.email,
    role: user.role,
    iat: moment().unix(),
    exp: moment().add(15, "minutes").unix(),
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

export const createNewAccesToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    surname: user.surname,
    username: user.username,
    email: user.email,
    role: user.role,
    iat: moment().unix(),
    exp: moment().add(15, "minutes").unix(),
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

export const createRefreshToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    username: user.username,
    email: user.email,
    role: user.role,
    iat: moment().unix(),
    exp: moment().add(7, "days").unix(),
  };

  return jwt.sign(payload, process.env.REFRESH_SECRET);
};
