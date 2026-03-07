import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { snsService } from '../services/aws/sns.service';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-memory OTP storage (in production, use Redis or DynamoDB with TTL)
const otpStore = new Map<string, { otp: string; expiresAt: number; userData: any }>();

export class AuthController {
  async sendOTP(req: Request, res: Response) {
    try {
      const { phone, email, name, role, password } = req.body;

      // Validate phone number format (basic validation)
      if (!phone || !phone.match(/^\+?[1-9]\d{1,14}$/)) {
        return res.status(400).json({ error: 'Invalid phone number format. Use international format (e.g., +919876543210)' });
      }

      // Check if user already exists
      const existingUsers = await dynamoDBService.scan(
        process.env.DYNAMODB_USERS_TABLE!,
        'email = :email',
        { ':email': email }
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Check if phone already exists
      const existingPhone = await dynamoDBService.scan(
        process.env.DYNAMODB_USERS_TABLE!,
        'phone = :phone',
        { ':phone': phone }
      );

      if (existingPhone.length > 0) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP and user data temporarily
      otpStore.set(phone, {
        otp,
        expiresAt,
        userData: { email, name, role, password, phone }
      });

      // Send OTP via SMS
      try {
        await snsService.sendOTP(phone, otp);
        console.log('\n' + '='.repeat(60));
        console.log('🔐 OTP VERIFICATION CODE');
        console.log('='.repeat(60));
        console.log(`📱 Phone: ${phone}`);
        console.log(`🔢 OTP: ${otp}`);
        console.log(`⏰ Expires in: 10 minutes`);
        console.log('='.repeat(60) + '\n');
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // In development, continue even if SMS fails
        console.log('\n' + '='.repeat(60));
        console.log('🔐 OTP VERIFICATION CODE (Development Mode)');
        console.log('='.repeat(60));
        console.log(`📱 Phone: ${phone}`);
        console.log(`🔢 OTP: ${otp}`);
        console.log(`⏰ Expires in: 10 minutes`);
        console.log('⚠️  SMS sending failed - using console output');
        console.log('='.repeat(60) + '\n');
      }

      res.status(200).json({ 
        message: 'OTP sent successfully to your phone number',
        expiresIn: 600 // seconds
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

  async verifyOTPAndRegister(req: Request, res: Response) {
    try {
      const { phone, otp } = req.body;

      // Get stored OTP data
      const otpData = otpStore.get(phone);

      if (!otpData) {
        return res.status(400).json({ error: 'OTP not found or expired. Please request a new OTP.' });
      }

      // Check if OTP expired
      if (Date.now() > otpData.expiresAt) {
        otpStore.delete(phone);
        return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      }

      // OTP verified - proceed with registration
      const { email, password, name, role } = otpData.userData;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        role,
        phone,
        phoneVerified: true,
        profile: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoDBService.put(process.env.DYNAMODB_USERS_TABLE!, user);

      // Clear OTP from store
      otpStore.delete(phone);

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, phoneVerified: true },
        token,
        message: 'Registration successful! Phone number verified.'
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role, phone, profile } = req.body;

      // Check if user exists
      const existingUsers = await dynamoDBService.scan(
        process.env.DYNAMODB_USERS_TABLE!,
        'email = :email',
        { ':email': email }
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with extended profile data
      const user = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        role,
        phone,
        phoneVerified: false, // Not verified in direct registration
        profile: profile || {}, // Store extended profile data (farm details, bank info, etc.)
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoDBService.put(process.env.DYNAMODB_USERS_TABLE!, user);

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const users = await dynamoDBService.scan(
        process.env.DYNAMODB_USERS_TABLE!,
        'email = :email',
        { ':email': email }
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { name, phone, profile } = req.body;

      // Get existing user
      const user = await dynamoDBService.get(process.env.DYNAMODB_USERS_TABLE!, { id: userId });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user data
      const updatedUser = {
        ...user,
        ...(name && { name }),
        ...(phone && { phone }),
        ...(profile && { profile }),
        updatedAt: new Date().toISOString(),
      };

      await dynamoDBService.put(process.env.DYNAMODB_USERS_TABLE!, updatedUser);

      res.json({
        user: { 
          id: updatedUser.id, 
          email: updatedUser.email, 
          name: updatedUser.name, 
          role: updatedUser.role,
          profile: updatedUser.profile 
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Profile update failed' });
    }
  }
}
