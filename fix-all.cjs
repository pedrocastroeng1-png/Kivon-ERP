const fs = require('fs');

function fixJSX(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    '<div className="block lg:hidden space-y-4">',
    '<>\n          <div className="block lg:hidden space-y-4">'
  );
  content = content.replace(
    '<div className="block lg:hidden space-y-4 p-4">',
    '<>\n          <div className="block lg:hidden space-y-4 p-4">'
  );
  content = content.replace(
    '</table>\n          </div>\n        )}',
    '</table>\n          </div>\n          </>\n        )}'
  );

  fs.writeFileSync(filePath, content);
}

fixJSX('src/features/projects/pages/ProjectsPage.tsx');
fixJSX('src/features/employees/pages/EmployeesPage.tsx');
fixJSX('src/features/users/pages/UsersPage.tsx');
fixJSX('src/features/job-roles/pages/JobRolesPage.tsx');
