import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/protectedRoute";
import PublicRoute from "./components/publicRoute";
import Navbar from "./components/Navbar";
import { useAppContext } from "./context/AppContext";
import { PageLoader } from "./components/ui/primitives";
import DemoLayer from "./demo/DemoLayer";
import { useDemo } from "./demo/useDemo";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const SelectRole = lazy(() => import("./pages/SelectRole"));
const Account = lazy(() => import("./pages/Account"));
const RestaurantPage = lazy(() => import("./pages/RestaurantPage"));
const Cart = lazy(() => import("./pages/Cart"));
const AddAddressPage = lazy(() => import("./pages/Address"));
const CheckoutPage = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const RiderDashboard = lazy(() => import("./pages/RiderDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Restaurant = lazy(() =>
  import("./pages/Restaurant").then((m) => ({ default: m.Restaurant })),
);

// Redirect /paymentsuccess?session_id=... → /order-success?session_id=...
// Handles Stripe sessions created before the success_url was updated.
function PaymentSuccessRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/order-success${search}`} replace />;
}

const toasterOptions = {
  position: "top-center" as const,
  toastOptions: {
    className: "toast-pop",
    duration: 3200,
  },
};

const CustomerApp = () => (
  <BrowserRouter>
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/account" element={<Account />} />
              <Route path="/restaurant/:id" element={<RestaurantPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/address" element={<AddAddressPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:orderId" element={<OrderPage />} />
              <Route
                path="/paymentsuccess/:paymentId"
                element={<PaymentSuccess />}
              />
              <Route
                path="/paymentsuccess"
                element={<PaymentSuccessRedirect />}
              />
              <Route path="/order-success" element={<OrderSuccess />} />
            </Route>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/select-role" element={<SelectRole />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  </BrowserRouter>
);

const RoleApp = ({ role }: { role?: string }) => {
  if (role === "seller") {
    return (
      <Suspense fallback={<PageLoader label="Opening your kitchen…" />}>
        <Restaurant />
      </Suspense>
    );
  }
  if (role === "rider") {
    return (
      <Suspense fallback={<PageLoader label="Starting your engine…" />}>
        <RiderDashboard />
      </Suspense>
    );
  }
  if (role === "admin") {
    return (
      <Suspense fallback={<PageLoader label="Loading console…" />}>
        <Admin />
      </Suspense>
    );
  }
  return <CustomerApp />;
};

const App = () => {
  const { user, loading } = useAppContext();
  const { active: demoActive, role: demoRole } = useDemo();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <RoleApp
        key={demoActive ? `demo-${demoRole}` : "live"}
        role={user?.role}
      />
      <DemoLayer />
      <Toaster {...toasterOptions} />
    </>
  );
};

export default App;
