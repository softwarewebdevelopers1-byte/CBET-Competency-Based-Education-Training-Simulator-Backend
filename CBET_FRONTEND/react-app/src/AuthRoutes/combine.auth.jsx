import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// component for checking if user is already logged in and redirecting accordingly
export function AuthRoutes({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    let CbetUser = JSON.parse(localStorage.getItem("cbet_user"))?.user;
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
        navigate("/login");
      }
      if (res.ok) {
        navigate("/dashboard");
      }
    }
    if (CbetUser) {
      checkAuth();
    }
  }, []);
  return <>{children}</>;
}
