import validator from "validator";

const validateRegister = (params) => {
  let name =
    validator.isAlpha(params.name, "es-ES") &&
    validator.isLength(params.name, { min: 3, max: undefined });

  if (!name) {
    throw new Error(
      "Name field should have only letters and 3 minimun length characters"
    );
  }

  let surname =
    validator.isAlpha(params.surname, "es-ES") &&
    validator.isLength(params.surname, { min: 3, max: undefined });

  if (!surname) {
    throw new Error(
      "Surname field should have only letters and 3 minimun length characters"
    );
  }

  if (params.username) {
    let username = validator.isLength(params.username, {
      min: 2,
      max: 18,
    });

    if (!username) {
      throw new Error("Username field should have 2 minimun length characters");
    }
  }

  if (params.artisticName) {
    let artisticName = validator.isLength(params.artisticName, {
      min: 2,
      max: 18,
    });

    if (!artisticName) {
      throw new Error("Artistic name should have 2 minimun length characters");
    }
  }

  let email = validator.isEmail(params.email);

  if (!email) {
    throw new Error("Invalid email");
  }

  let password = validator.isLength(params.password, { min: 6, max: 15 });

  if (!password) {
    throw new Error("Password field should have 6 minimun characters length");
  }
};

export default {
  validateRegister,
};
