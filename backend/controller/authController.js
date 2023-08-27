import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import UserDTO from "../DTO/index.js";
import JwtService from "../services/JWTServices.js";
import RefreshToken from "../models/token.js";
const passwordPattren =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[ -/:-@\[-`{-~]).{6,64}$/;
const authController = {
  //register method
  async register(req, res, next) {
    //validate user input
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattren).required(),
      confirmpassword: Joi.ref("password"),
    });
    //validate userRegisterSchema
    const { error } = userRegisterSchema.validate(req.body);

    if (error) {
      return next(error);
    }
    const { username, name, email, password } = req.body;

    //password hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    //handle username and email coflict
    try {
      const emailInUse = await User.exists({ email });
      const usernameInUse = await User.exists({ username });
      if (emailInUse) {
        const error = {
          status: 409,
          message: "email is already in use please use anOther email!!!",
        };
        return next(error);
      }
      if (usernameInUse) {
        const error = {
          status: 409,
          message:
            "username is not available please choose anOther username!!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //save userRegister in database
    let user;
    try {
      const userToRegister = new User({
        username,
        name,
        email,
        password: hashedPassword,
      });
      user = await userToRegister.save();
    } catch (error) {
      return next(error);
    }
    //genrating tokens
    const accessToken = JwtService.signAccessToken({ _id: user._id }, "30m");
    const refreshToken = JwtService.signRefreshToken({ _id: user._id }, "60m");
    //saving refresh token to database
    await JwtService.storeRefreshToken(refreshToken, user._id);
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //DTO
    const userDto = new UserDTO(user);
    //sending response
    res.status(201).json({ user: userDto, auth: true });
  },
  //login method

  async login(req, res, next) {
    //validation user input
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattren).required(),
    });
    //validate userLoginSchema
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, password } = req.body;
    let user;
    try {
      user = await User.findOne({ username });
      if (!user) {
        const error = {
          status: 401,
          message: "invalid username!!!",
        };
        return next(error);
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        const error = {
          status: 401,
          message: "invalid password!!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //genrating tokens
    const accessToken = JwtService.signAccessToken({ _id: user._id }, "30m");
    const refreshToken = JwtService.signRefreshToken({ _id: user._id }, "60m");
    //update refresh token to the database
    try {
      await RefreshToken.updateOne(
        { _id: user._id },
        { token: refreshToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }
    //senging tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //DTO
    const userDto = new UserDTO(user);
    //sending response
    res.status(200).json({ user: userDto, auth: true });
  },

  //logout method
  async logout(req, res, next) {
    //fetch refresh token from cookies and delete from database
    const { refreshToken } = req.cookies;
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }

    //clearcookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    //sending response
    res.status(200).json({ user: null, auth: false });
  },

  //refresh method
  async refresh(req, res, next) {
    //fetch refreshToken from cookies
    const originalrefreshToken = req.cookies.refreshToken;

    //verify refreshtoken
    let _id;
    try {
      _id = JwtService.verifyRefreshToken(originalrefreshToken)._id;
    } catch (e) {
      const error = {
        status: 401,
        message: "unAuthorized!!!",
      };
      return next(error);
    }

    //match id and token
    try {
      const match = await RefreshToken.findOne({
        _id,
        token: originalrefreshToken,
      });
      if (!match) {
        const error = {
          status: 401,
          message: "unAuthorized!!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //genrate new tokens
    const accessToken = JwtService.signAccessToken({ _id: _id }, "30m");
    const refreshToken = JwtService.signRefreshToken({ _id: _id }, "60m");
    //update refreshToken to the database
    await RefreshToken.updateOne({ _id: _id }, { token: refreshToken });
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //DTO
    const user = await User.findOne({ _id });
    const userDto = new UserDTO(user);
    //sending response
    res.status(200).json({ user: userDto });
  },
};

export default authController;
