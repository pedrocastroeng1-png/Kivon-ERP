const fs = require('fs');
let content = fs.readFileSync('src/shared/components/layout/AppLayout.tsx', 'utf8');

// Fix imports
if (!content.includes('useSmartCenter')) {
  content = content.replace(
    "import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';",
    "import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';\nimport { SmartCenterDrawer } from '@/src/features/smart-center/components/SmartCenterDrawer';\nimport { useSmartCenter } from '@/src/features/smart-center/hooks/useSmartCenter';"
  );
}

// Fix variables
content = content.replace(
  /const \[isSmartCenterOpen, setIsSmartCenterOpen\] = useState\(false\);\n  const { unreadCount } = useSmartCenter\(\);\n  const \[isSmartCenterOpen, setIsSmartCenterOpen\] = useState\(false\);\n  const { unreadCount } = useSmartCenter\(\);/g,
  'const [isSmartCenterOpen, setIsSmartCenterOpen] = useState(false);\n  const { unreadCount } = useSmartCenter();'
);

// Fix Megaphone icon in navigation array if it fails TS
if (!content.includes('Megaphone') && content.includes('/central-inteligente')) {
  content = content.replace(
    'MenuSquare } from',
    'MenuSquare, Megaphone } from'
  );
}

// I will just wipe out duplicates in declarations
const regex = /const \[isSmartCenterOpen, setIsSmartCenterOpen\] = useState\(false\);\s*const { unreadCount } = useSmartCenter\(\);/g;
const matches = content.match(regex);
if (matches && matches.length > 1) {
    content = content.replace(regex, '');
    content = content.replace('const [isOffline, setIsOffline] = useState(!navigator.onLine);', 'const [isOffline, setIsOffline] = useState(!navigator.onLine);\n  const [isSmartCenterOpen, setIsSmartCenterOpen] = useState(false);\n  const { unreadCount } = useSmartCenter();');
}

fs.writeFileSync('src/shared/components/layout/AppLayout.tsx', content);
