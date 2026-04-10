import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";


const ProtectedRoute = () => {
    const { isAuth ,loading, user } = useAppContext();
    const location = useLocation();
    if (loading) {
        return null;
    }
    // useLocation is a React Router hook that returns the current location object,
    // giving access to information about the current URL (such as pathname, search, and state).
    
    if (!isAuth) {
        return <Navigate to="/login" />;
    }
    if(!user?.role  && location.pathname !== "/select-role") {
        return <Navigate to="/select-role"  replace/>;
        //what is replace?
        //replace is a boolean that indicates whether to replace the current entry in the history stack with the new location.
        //if true, the new location will replace the current entry, so that the user cannot navigate back to the previous location.
        //if false, the new location will be added to the history stack, so that the user can navigate back to the previous location.
        //in this case, we want to replace the current entry in the history stack with the new location, so that the user cannot navigate back to the previous location.
        //so we set replace to true.
    }
    if(user?.role && location.pathname === "/select-role") {
        return <Navigate to="/"  replace/>;
    }
    return <Outlet />;
}

export default ProtectedRoute;