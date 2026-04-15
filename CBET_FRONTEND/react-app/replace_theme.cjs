const fs = require('fs');
const path = require('path');

const cssFiles = [
  "src/css/sidebar.module.css",
  "src/css/scenario.module.css",
  "src/css/portfolio.module.css",
  "src/css/homepage.module.css",
  "src/css/courses.module.css",
  "src/css/assessments.module.css",
  "src/css/error.module.css",
  "src/css/achievements.module.css",
  "src/admin/styles/userManagement.module.css",
  "src/admin/styles/simulationManagement.module.css",
  "src/admin/styles/header.module.css",
  "src/admin/styles/dashboard.module.css"
];

for (const file of cssFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g, ':global([data-theme="dark"])');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Not found: ${file}`);
  }
}

// Modify Sidebar.jsx
const sidebarPath = path.join(__dirname, 'src/admin/components/Sidebar.jsx');
if (fs.existsSync(sidebarPath)) {
  let content = fs.readFileSync(sidebarPath, 'utf8');
  
  if (!content.includes('useTheme')) {
    content = content.replace('LogOut,\n} from "lucide-react";', 'LogOut,\n  Sun,\n  Moon,\n} from "lucide-react";');
    content = content.replace('import styles from "../styles/Sidebar.module.css";', 'import styles from "../styles/Sidebar.module.css";\nimport { useTheme } from "../../../contexts/ThemeContext";');
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

// Modify Dashboard/dashboard.jsx
const dashboardPath = path.join(__dirname, 'src/Dashboard/dashboard.jsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  
  if (!content.includes('useTheme')) {
    content = content.replace('import { Sidebar } from "./sidebar.jsx";', 'import { Sidebar } from "./sidebar.jsx";\nimport { useTheme } from "../contexts/ThemeContext";\nimport { Moon, Sun } from "lucide-react";');
    content = content.replace('export const Dashboard = ({ children }) => {', 'export const Dashboard = ({ children }) => {\n  const { theme, toggleTheme } = useTheme();');
    
    const toggleButton = `
            <button
              onClick={toggleTheme}
              style={{
                background: "transparent",
                border: "none",
                color: theme === 'light' ? "#64748b" : "#e2e8f0",
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className={styles.userProfile}>`;
    
    content = content.replace('<div className={styles.userProfile}>', toggleButton);
    fs.writeFileSync(dashboardPath, content);
    console.log(`Updated dashboard.jsx`);
  }
}
