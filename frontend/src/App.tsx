import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/protectedRoute";
import PublicRoute from "./components/publicRoute";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/Navbar";
import Account from "./pages/Account";
import { Restaurant } from "./pages/Restaurant";
import { useAppContext } from "./context/AppContext";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/Address";
import CheckoutPage from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderSuccess from "./pages/OrderSuccess";
export const AuthService = "http://localhost:3000";
export const restaurantService = "http://localhost:3001";
export const utilsService = "http://localhost:3002";
export const realtimeService = "http://localhost:3005";

// Redirect /paymentsuccess?session_id=... → /order-success?session_id=...
// Handles Stripe sessions created before the success_url was updated.
function PaymentSuccessRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/order-success${search}`} replace />;
}

const App = () => {
  const { user } = useAppContext();
  if (user?.role === "seller") {
    return (
      <>
        <Restaurant />
        <Toaster />
      </>
    );
  }
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/account" element={<Account />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/address" element={<AddAddressPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/paymentsuccess/:paymentId"
              element={<PaymentSuccess />}
            />
            <Route path="/paymentsuccess" element={<PaymentSuccessRedirect />} />
            <Route path="/order-success" element={<OrderSuccess />} />
          </Route>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/select-role" element={<SelectRole />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
