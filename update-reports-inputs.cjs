const fs = require('fs');
let content = fs.readFileSync('src/features/daily-reports/pages/DailyReportsPage.tsx', 'utf8');

content = content.replace(
  'className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"',
  'className="flex h-12 sm:h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"'
);
content = content.replace(
  'className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"',
  'className="flex h-12 sm:h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"'
);

fs.writeFileSync('src/features/daily-reports/pages/DailyReportsPage.tsx', content);
