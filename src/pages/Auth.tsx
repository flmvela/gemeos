import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new login page
    navigate('/login', { replace: true });
  }, [navigate]);

  // This component will redirect, so return null
  return null;
};

export default Auth;
