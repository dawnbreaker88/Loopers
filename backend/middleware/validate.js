import { z } from 'zod';
import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Assign sanitized data back
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const issueMessages = error.errors.map(err => {
        const path = err.path.slice(1).join('.');
        return `${path ? path + ': ' : ''}${err.message}`;
      }).join('; ');
      return next(new AppError(`Validation Error: ${issueMessages}`, 400));
    }
    return next(new AppError('Invalid request data format', 400));
  }
};

// Zod Schemas for Production API Validation
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['customer', 'admin']).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email or Phone is required'),
    password: z.string().min(1, 'Password is required')
  })
});

export const addressSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Phone number is required'),
    houseNumber: z.string().min(1, 'House/Room number is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(6, 'Pincode is required'),
    isDefault: z.boolean().optional()
  })
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
  })
});

export const addressIdParamSchema = z.object({
  params: z.object({
    addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Address ID format')
  })
});
