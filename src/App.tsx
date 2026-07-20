import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import ListingDetail from "./pages/ListingDetail";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Support from "./pages/Support";
import Messages from "./pages/Messages";
import MyListings from "./pages/MyListings";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<Support />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
