import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const clearStoredAuthData = () => {
  localStorage.removeItem("cbet_user");
  localStorage.removeItem("token");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("cbet_user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("admin_user");
};

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("cbet_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};
// component for checking if user is already logged in and redirecting accordingly
export function AuthRoutes({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    let localUser = readStoredUser();
    let CbetUser = localUser?.user;
    async function checkAuth() {
      let res = await fetch("http://localhost:8000/auth/user/check/logged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: CbetUser,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        clearStoredAuthData();
        navigate("/login");
        return;
      }
      if (res.ok) {
        navigate(
          localUser?.role === "admin"
            ? "/admin/dashboard"
            : localUser?.role === "trainer"
              ? "/trainer/dashboard"
              : "/dashboard",
        );
      }
    }
    if (CbetUser) {
      checkAuth();
    } else {
      clearStoredAuthData();
    }
  }, []);
  return <>{children}</>;
}
