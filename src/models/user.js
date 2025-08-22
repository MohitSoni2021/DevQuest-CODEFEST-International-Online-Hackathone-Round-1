import Joi from "joi";

class User {
  constructor(id, email, firstName, lastName, password, securityQuestions = [],isAdmin = false, ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.isAdmin = isAdmin;
    this.securityQuestions = securityQuestions;
  }

  validate = () => {
    const schema = Joi.object({
      id: Joi.string().uuid().required(),
      email: Joi.string().email().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      isAdmin: Joi.boolean().required(),
    });

    return schema.validate({
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isAdmin: this.isAdmin,
    });
  };

validateSignup = () => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(30).required(),
    lastName: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('(?=.*[a-z])')) // at least one lowercase
      .pattern(new RegExp('(?=.*[A-Z])')) // at least one uppercase
      .pattern(new RegExp('(?=.*[0-9])')) // at least one number
      .pattern(new RegExp('(?=.*[!@#$%^&*(),.?":{}|<>])')) // at least one special char
      .required()
      .messages({
        'string.pattern.base': `Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character`,
        'string.min': 'Password must be at least 8 characters length'
      }),
    securityQuestions: Joi.array()
  });

  return schema.validate({
    email: this.email,
    password: this.password,
    firstName: this.firstName,
    lastName: this.lastName,
    securityQuestions: this.securityQuestions,
  });
};


  validateLogin = () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    return schema.validate({
      email: this.email,
      password: this.password,
    });
  };

  validateId = () => {
    const schema = Joi.object({
      id: Joi.string().uuid().required(),
    });

    const validate = schema.validate({ id: this.id });

    if (validate.error) return validate.error.details[0].message;
  };
}

export default User;
