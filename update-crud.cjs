const fs = require('fs');

function processCrudPage(filePath) {
  if(!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Convert tables to responsive cards
  const tableRegex = /<div className="overflow-x-auto">([\s\S]*?)<\/table>\s*<\/div>/;
  
  if (tableRegex.test(content)) {
    console.log('Needs manual update for ' + filePath);
  }
}

processCrudPage('src/features/projects/pages/ProjectsPage.tsx');
processCrudPage('src/features/employees/pages/EmployeesPage.tsx');
processCrudPage('src/features/job-roles/pages/JobRolesPage.tsx');
processCrudPage('src/features/users/pages/UsersPage.tsx');
