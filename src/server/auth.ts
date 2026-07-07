import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const requireAdmin = async (req: Request | any, res: Response | any, next?: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.headers['x-user-id'] = user.id;

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('profiles!inner(code), active')
      .eq('id', user.id)
      .single();

    const profileCodeFromJoin = (userData as any)?.profiles?.code;
    const active = (userData as any)?.active;

    if (userError || profileCodeFromJoin !== 'admin' || !active) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    if (next) {
      next();
    } else {
      // For Vercel serverless functions without 'next'
      return null;
    }
  } catch (err: any) {
    console.error('requireAdmin error:', err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
};

export const requireAuth = async (req: Request | any, res: Response | any, next?: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.headers['x-user-id'] = user.id;
    
    if (next) {
      next();
    } else {
      return null;
    }
  } catch (err: any) {
    console.error('requireAuth error:', err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
};
