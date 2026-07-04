var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_supabase_js = require("@supabase/supabase-js");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
var SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
var supabaseAdmin = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("code").eq("id", user.id).single();
    if (profileError || profile?.code !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
  };
  app.post("/api/users", verifyAdmin, async (req, res) => {
    const { email, fullName, profileCode } = req.body;
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName
        }
      });
      if (authError) throw authError;
      const userId = authData.user.id;
      const { data: profileObj, error: profileObjError } = await supabaseAdmin.from("profiles").select("id").eq("code", profileCode).single();
      if (profileObjError || !profileObj) {
        throw new Error("Profile not found: " + profileCode);
      }
      const { error: userInsertError } = await supabaseAdmin.from("users").insert({
        id: userId,
        profile_id: profileObj.id,
        full_name: fullName,
        active: true
      });
      if (userInsertError) throw userInsertError;
      res.json({ success: true, user: authData.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/users/:id/resend-invite", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (userError) throw userError;
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(userData.user.email);
      if (inviteError) throw inviteError;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/users/:id/reset-password", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (userError) throw userError;
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(userData.user.email);
      if (resetError) throw resetError;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  async function bootstrapAdmin() {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "pedrotargos@gmail.com";
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "KivonAdmin2026!";
    try {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) {
        console.warn("Skipping bootstrap: Unable to fetch users. Ensure SUPABASE_SECRET_KEY is valid.");
        return;
      }
      const existingUser = usersData.users.find((u) => u.email === adminEmail);
      let userId = existingUser?.id;
      if (!existingUser) {
        console.log(`Creating initial admin user: ${adminEmail}`);
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: "Administrador do Sistema" }
        });
        if (authError) throw authError;
        userId = authData.user.id;
      } else {
        console.log(`Initial admin user ${adminEmail} already exists.`);
      }
      const { data: profileObj, error: profileObjError } = await supabaseAdmin.from("profiles").select("id").eq("code", "admin").single();
      if (profileObjError || !profileObj) {
        console.warn("Skipping bootstrap link: Admin profile not found in database.");
        return;
      }
      const { data: userRec } = await supabaseAdmin.from("users").select("id").eq("id", userId).single();
      if (!userRec) {
        console.log("Linking initial admin to public.users...");
        const { error: userInsertError } = await supabaseAdmin.from("users").insert({
          id: userId,
          profile_id: profileObj.id,
          full_name: "Administrador do Sistema",
          active: true
        });
        if (userInsertError) throw userInsertError;
      }
    } catch (err) {
      console.error("Admin bootstrap failed:", err.message);
    }
  }
  await bootstrapAdmin();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
