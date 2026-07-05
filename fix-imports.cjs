const fs = require('fs');
let content = fs.readFileSync('src/shared/components/layout/AppLayout.tsx', 'utf8');

if (!content.includes('import { useSmartCenter }')) {
  content = content.replace(
    "import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';",
    "import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';\nimport { SmartCenterDrawer } from '@/src/features/smart-center/components/SmartCenterDrawer';\nimport { useSmartCenter } from '@/src/features/smart-center/hooks/useSmartCenter';"
  );
}

if (!content.includes('Megaphone } from')) {
    content = content.replace(
        'MenuSquare } from',
        'MenuSquare, Megaphone } from'
    );
}

fs.writeFileSync('src/shared/components/layout/AppLayout.tsx', content);
