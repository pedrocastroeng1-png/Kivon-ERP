const fs = require('fs');
let content = fs.readFileSync('src/shared/components/layout/AppLayout.tsx', 'utf8');

if (!content.includes('Central Inteligente') && !content.includes('/central-inteligente')) {
  // We need to import an icon for it. 'BellRing' or 'MessageSquare' or 'Radio'
  // I'll import Megaphone or Bell
  content = content.replace(
    "import { X, Menu, Search, LogOut, FileText, Database, Briefcase, Activity, Building, Users, Calendar, Settings, Download, CalendarCheck, WifiOff, Bell } from 'lucide-react';",
    "import { X, Menu, Search, LogOut, FileText, Database, Briefcase, Activity, Building, Users, Calendar, Settings, Download, CalendarCheck, WifiOff, Bell, Megaphone } from 'lucide-react';"
  );
  
  content = content.replace(
    "{ name: 'Cargos', href: '/cargos', icon: Briefcase, show: isAdmin },",
    "{ name: 'Cargos', href: '/cargos', icon: Briefcase, show: isAdmin },\n    { name: 'Central Inteligente', href: '/central-inteligente', icon: Megaphone, show: isAdmin },"
  );

  fs.writeFileSync('src/shared/components/layout/AppLayout.tsx', content);
}
