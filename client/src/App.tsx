import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./components/code/SpashScreen";
import Login from "./app/auth/login/Login";
import Register from "./app/auth/register/Register";
import ProtectedRoute from "./components/code/ProtectedRoutes";
import DashboardLayout from "./app/dashboard/DashboardLayout";
import Homepage from "./app/dashboard/home/Home";
import SinglePostDetails from "./app/dashboard/home/components/SinglePostDetails";
import AllCommunities from "./app/dashboard/community/All-Communities/AllCommunities";
import CreateCommunity from "./app/dashboard/community/CreateCommunity/CreateCommunity";
import SingleCommunityDetails from "./app/dashboard/community/All-Communities/SingleCommunityDetails";
import NotFound from "./components/code/NotFound";
import Drafts from "./app/dashboard/posts/drafts/Drafts";
import Scheduled from "./app/dashboard/posts/scheduled/Scheduled";
import Published from "./app/dashboard/posts/published/Published";
import Profile from "./app/dashboard/profile/Profile";
import Popular from "./app/dashboard/popular/Popular";
import FAQ from "./app/dashboard/help/FAQ";

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("splashShown");
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2200} />;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="/dashboard/popular" element={<Popular />} />
            <Route path="/dashboard/feeds" element={<Homepage />} />
            <Route
              path="/dashboard/feeds/:id"
              element={<SinglePostDetails />}
            />
            <Route
              path="/dashboard/communities/all"
              element={<AllCommunities />}
            />
            <Route
              path="/dashboard/communities/create"
              element={<CreateCommunity />}
            />
            <Route
              path="/dashboard/communities/:id"
              element={<SingleCommunityDetails />}
            />

            <Route path="/dashboard/posts/drafts" element={<Drafts />} />
            <Route path="/dashboard/posts/scheduled" element={<Scheduled />} />
            <Route path="/dashboard/posts/published" element={<Published />} />

            <Route path="/dashboard/profile/:id" element={<Profile />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/help" element={<FAQ />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
