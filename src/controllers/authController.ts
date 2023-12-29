import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().max(256),
  password: z.string().min(8).max(72),
  name: z.string().max(256),
});

// type RegisterBody = z.infer<typeof registerSchema>;

export const register: RequestHandler = async (req, res) => {
  const body = registerSchema.safeParse(req.body);

  if (!body.success) return res.sendStatus(400);

  const { email, username, password, name } = body.data;

  const hash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
        password: hash,
        is_social_auth: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        password: false,
      },
    });

    // res.status(201).json({ user });

    res.redirect(307, "/api/auth/login");
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code == "P2002") {
        return res
          .status(409)
          .json({ message: "Username or email is already used!" });
      }
    }

    res.sendStatus(500);
  }
};

export const login: RequestHandler = async (req, res) => {
  res.status(200).json({ user: req.user });
};

export const logout: RequestHandler = async (req, res) => {
  console.log(req.user);

  req.session.destroy((err) => {
    if (err) {
      res.status(400).send("Unable to log out");
    } else {
      // res.cookie("connect.sid", "null", { maxAge: 1 });
      res.send("Logout successful");
    }
  });
};
