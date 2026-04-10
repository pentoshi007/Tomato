import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";


const PublicRoute = () => {
    const { isAuth, loading, user } = useAppContext();
    const location = useLocation();

    if (loading) {
        return null;
    }

    // If the user is already authenticated, route them based on whether they have a role.
    // This prevents a redirect loop between `/` (ProtectedRoute) and `/select-role` (PublicRoute).
    if (isAuth) {
        if (user?.role) {
            if (location.pathname !== "/") {
                return <Navigate to="/" replace />;
            }
            return <Outlet />;
        }

        // Authenticated but role not selected yet.
        if (location.pathname !== "/select-role") {
            return <Navigate to="/select-role" replace />;
        }
        return <Outlet />;
    }

    return <Outlet />;
}

export default PublicRoute;