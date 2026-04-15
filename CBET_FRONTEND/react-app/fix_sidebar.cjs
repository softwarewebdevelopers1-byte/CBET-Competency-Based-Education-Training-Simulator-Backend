const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'src/admin/components/Sidebar.jsx');
if (fs.existsSync(sidebarPath)) {
  let content = fs.readFileSync(sidebarPath, 'utf8');
  
  if (!content.includes('useTheme')) {
    content = content.replace('LogOut,\n} from "lucide-react";', 'LogOut,\n  Sun,\n  Moon,\n} from "lucide-react";');
    content = content.replace('import styles from "../styles/Sidebar.module.css";', 'import styles from "../styles/Sidebar.module.css";\nimport { useTheme } from "../../contexts/ThemeContext";');
    content = content.replace('const Sidebar = ({ collapsed, setCollapsed }) => {', 'const Sidebar = ({ collapsed, setCollapsed }) => {\n  const { theme, toggleTheme } = useTheme();');
    
    const toggleButton = `
          <button
            className={styles.navItem}
            onClick={toggleTheme}
            data-tooltip={theme === 'light' ? "Dark Mode" : "Light Mode"}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className={styles.navLabel}>{theme === 'light' ? "Dark Mode" : "Light Mode"}</span>
          </button>
`;
    content = content.replace('<div className={styles.sidebarFooter}>', `<div className={styles.sidebarFooter}>\n${toggleButton}`);
    fs.writeFileSync(sidebarPath, content);
    console.log(`Updated Sidebar.jsx`);
  }
}
