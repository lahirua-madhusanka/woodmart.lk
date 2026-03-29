import { Navigate } from "react-router-dom";

function AdminIndexRedirect() {
  return <Navigate to="/admin" replace />;
}

export default AdminIndexRedirect;
