import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Evaluate } from "./pages/Evaluate";
import { History } from "./pages/History";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/evaluate/:employeeId" element={<Evaluate />} />
              <Route path="/history/:employeeId" element={<History />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
