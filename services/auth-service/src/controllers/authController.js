const { ApiResponse } = require('@stockpilot/common');
const authService = require('../services/authService');
const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().optional(),
  companyCode: z.string().optional(),
  phone: z.string().optional(),
  plan: z.string().optional()
});

const completeProfileSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companyCode: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  taxNumber: z.string().optional(),
  plan: z.string().default('TRIAL')
});

const loginSchema = z.object({
  companyCode: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

class AuthController {
  async register(req, res, next) {
    try {
      const validatedData = registerSchema.parse(req.body);
      let result;
      if (validatedData.companyCode && validatedData.companyName) {
        result = await authService.registerTenant(validatedData);
      } else {
        result = await authService.registerUser(validatedData);
      }
      return ApiResponse.created(res, result, 'Account registered successfully');
    } catch (err) {
      next(err);
    }
  }

  async completeProfile(req, res, next) {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return ApiResponse.error(res, 'Authentication required to complete profile', 401);
      }
      const validatedData = completeProfileSchema.parse(req.body);
      const result = await authService.completeProfile({ userId, ...validatedData });
      return ApiResponse.success(res, result, 'Organization profile setup completed successfully');
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      return ApiResponse.success(res, result, 'Logged in successfully');
    } catch (err) {
      next(err);
    }
  }

  async devLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Developer email is required' });
      }
      const result = await authService.devLogin({ email, password });
      return ApiResponse.success(res, result, 'Developer logged in successfully');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      return ApiResponse.success(res, tokens, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const user = await authService.getMe(userId);
      return ApiResponse.success(res, user, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      // Return success message safely
      return ApiResponse.success(res, null, 'If that email exists, reset instructions have been dispatched.');
    } catch (err) {
      next(err);
    }
  }

  async updateTenantStatus(req, res, next) {
    try {
      const { companyCode, status } = req.body;
      const tenant = await authService.updateTenantStatus({ companyCode, status });
      return ApiResponse.success(res, tenant, `Tenant [${companyCode}] status synced to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  async updateTenantPlan(req, res, next) {
    try {
      const { companyCode, plan } = req.body;
      const tenant = await authService.updateTenantPlan({ companyCode, plan });
      return ApiResponse.success(res, tenant, `Tenant [${companyCode}] plan synced to ${plan}`);
    } catch (err) {
      next(err);
    }
  }

  async getTenantLookupsInternal(req, res, next) {
    try {
      const data = await authService.getTenantLookupsInternal();
      return ApiResponse.success(res, data, 'Tenant lookups retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPendingUsersInternal(req, res, next) {
    try {
      const data = await authService.getPendingUsersInternal();
      return ApiResponse.success(res, data, 'Pending users retrieved');
    } catch (err) {
      next(err);
    }
  }

  async deletePendingUserInternal(req, res, next) {
    try {
      const result = await authService.deletePendingUserInternal(req.params.id);
      return ApiResponse.success(res, result, 'Pending user deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async syncUserInternal(req, res, next) {
    try {
      const user = await authService.createInternalUser(req.body);
      return ApiResponse.created(res, user, 'User synced in auth_db');
    } catch (err) {
      next(err);
    }
  }

  async syncUserUpdateInternal(req, res, next) {
    try {
      const user = await authService.updateInternalUser(req.params.id, req.body);
      return ApiResponse.success(res, user, 'User updated in auth_db');
    } catch (err) {
      next(err);
    }
  }

  async syncUserDeleteInternal(req, res, next) {
    try {
      const result = await authService.deleteInternalUser(req.params.id, req.query.tenantId);
      return ApiResponse.success(res, result, 'User deleted from auth_db');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();

