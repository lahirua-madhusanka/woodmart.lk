import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-pad py-20 text-center text-muted">
        Loading your account...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default PrivateRoute;
