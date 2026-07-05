const fs = require('fs');
let content = fs.readFileSync('src/features/daily-reports/pages/DailyReportsPage.tsx', 'utf8');

content = content.replace(
  '<div className="block lg:hidden">',
  '<>\n          <div className="block lg:hidden">'
);
content = content.replace(
  '</table>\n          </div>\n        )}',
  '</table>\n          </div>\n          </>\n        )}'
);

fs.writeFileSync('src/features/daily-reports/pages/DailyReportsPage.tsx', content);
