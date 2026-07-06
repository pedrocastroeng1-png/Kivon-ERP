import { supabaseAdmin, requireAdmin } from "../../../src/server/auth";

export default async function handler(req: any, res: any) {
  try {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authPassed = await requireAdmin(req, res);
  if (authPassed !== null) {
    return; // Response already sent
  }

  const { id } = req.query;

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (resetError) throw resetError;
      
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("=== API ERROR ===");
    console.error("error.name:", err.name);
    console.error("error.message:", err.message);
    console.error("error.stack:", err.stack);
    
    if (err.code) console.error("error.code:", err.code);
    if (err.details) console.error("error.details:", err.details);
    if (err.hint) console.error("error.hint:", err.hint);

    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}