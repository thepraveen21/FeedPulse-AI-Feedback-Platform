import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const login = (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required',
        data: null,
      });
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        data: null,
      });
      return;
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      error: null,
      data: { token },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Something went wrong',
      data: null,
    });
  }
};