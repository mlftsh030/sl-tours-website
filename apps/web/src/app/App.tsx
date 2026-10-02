import { AuthPage } from "../features/auth/AuthPage";
import { Navigate, Route, Routes } from "react-router-dom";
import { BookingPage } from "../features/booking/BookingPage";
import { GalleryPage } from "../features/gallery/GalleryPage";
import { lazy, Suspense, type ReactNode } from "react";
import { LoadingState } from "../components/StateBlocks";
import { PrivateTripPage } from "../features/private-trips/PrivateTripPage";
import { TripPlannerPage } from "../features/trip-planner/TripPlannerPage";
import { ExperiencesPage } from "../features/tours/ExperiencesPage";
import { HomePage } from "../features/tours/HomePage";
import { TourDetailPage } from "../features/tours/TourDetailPage";
import { AppLayout } from "../layouts/AppLayout";
import { AboutPage, ContactPage } from "./InfoPages";

// Signed-in areas load on demand so public pages keep their original bundle size.
const OperationsPage = lazy(() => import("../features/operations/OperationsPage").then(m => ({ default: m.OperationsPage })));
const DriverPortalPage = lazy(() => import("../features/driver/DriverPortalPage").then(m => ({ default: m.DriverPortalPage })));
const MyTripPage = lazy(() => import("../features/customer-trip/MyTripPage").then(m => ({ default: m.MyTripPage })));
const deferred = (page: ReactNode) => <Suspense fallback={<LoadingState label="Loading" />}>{page}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route path="operations/*" element={deferred(<OperationsPage />)} />
      <Route path="driver/*" element={deferred(<DriverPortalPage />)} />
      <Route path="login" element={<AuthPage />} />
      <Route path="register" element={<AuthPage registration />} />
      <Route path="account" element={deferred(<MyTripPage />)} />
      <Route path="my-trip" element={<Navigate to="/account" replace />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="experiences" element={<ExperiencesPage key="all" />} />
        <Route path="experiences/:slug" element={<TourDetailPage />} />
        <Route path="private-tours" element={<ExperiencesPage key="private" focus="private" />} />
        <Route path="transfers" element={<ExperiencesPage key="transfer" focus="transfer" />} />
        <Route path="book/:slug" element={<BookingPage />} />
        <Route path="book-private-trip" element={<PrivateTripPage />} />
        <Route path="plan-my-trip" element={<TripPlannerPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
