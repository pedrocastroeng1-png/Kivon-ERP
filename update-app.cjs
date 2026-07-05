const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('SmartCenterAdminPage')) {
  // Add import
  content = content.replace(
    "import JobRolesPage from './features/job-roles/pages/JobRolesPage';",
    "import JobRolesPage from './features/job-roles/pages/JobRolesPage';\nimport SmartCenterAdminPage from './features/smart-center/pages/SmartCenterAdminPage';"
  );
  
  // Add route
  content = content.replace(
    '<Route path="cargos" element={<JobRolesPage />} />',
    '<Route path="cargos" element={<JobRolesPage />} />\n            <Route path="central-inteligente" element={<SmartCenterAdminPage />} />'
  );

  fs.writeFileSync('src/App.tsx', content);
}
