import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout.jsx';
import OrganizerLayout from '../layouts/OrganizerLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import AdminRoute from '../routes/AdminRoute.jsx';

// Public pages
import HomePage from '../pages/public/HomePage.jsx';
import EventsPage from '../pages/public/EventsPage.jsx';
import EventDetailPage from '../pages/public/EventDetailPage.jsx';
import BlogListPage from '../pages/public/BlogListPage.jsx';
import BlogDetailPage from '../pages/public/BlogDetailPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';

// Auth pages
import LoginPage from '../pages/auth/LoginPage.jsx';
import SignupPage from '../pages/auth/SignupPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';

// User pages
import ProfilePage from '../pages/user/ProfilePage.jsx';
import AthleteDashboardPage from '../pages/user/AthleteDashboardPage.jsx';
import RegisterEventPage from '../pages/user/RegisterEventPage.jsx';
import PaymentPage from '../pages/user/PaymentPage.jsx';
import PaymentFailedPage from '../pages/user/PaymentFailedPage.jsx';
import RegistrationSuccessPage from '../pages/user/RegistrationSuccessPage.jsx';
import MyRegistrationsPage from '../pages/user/MyRegistrationsPage.jsx';
import RegistrationDetailPage from '../pages/user/RegistrationDetailPage.jsx';
import SavedEventsPage from '../pages/user/SavedEventsPage.jsx';
import NotificationsPage from '../pages/user/NotificationsPage.jsx';

// Organizer pages
import OrganizerRegisterPage from '../pages/organizer/OrganizerRegisterPage.jsx';
import OrganizerDashboardPage from '../pages/organizer/OrganizerDashboardPage.jsx';
import OrganizerEventsPage from '../pages/organizer/OrganizerEventsPage.jsx';
import CreateEventPage from '../pages/organizer/CreateEventPage.jsx';
import EditEventPage from '../pages/organizer/EditEventPage.jsx';
import ManageRegistrationsPage from '../pages/organizer/ManageRegistrationsPage.jsx';
import OrganizerEventAnalyticsPage from '../pages/organizer/OrganizerEventAnalyticsPage.jsx';
import OrganizerSettingsPage from '../pages/organizer/OrganizerSettingsPage.jsx';
import OrganizerCheckinPage from '../pages/organizer/OrganizerCheckinPage.jsx';
import OrganizerCheckinSelectPage from '../pages/organizer/OrganizerCheckinSelectPage.jsx';

// Admin pages
import AdminLoginPage from '../pages/admin/AdminLoginPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminOrganizersPage from '../pages/admin/AdminOrganizersPage.jsx';
import AdminEventsPage from '../pages/admin/AdminEventsPage.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import AdminRegistrationsPage from '../pages/admin/AdminRegistrationsPage.jsx';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage.jsx';
import AdminBlogPage from '../pages/admin/AdminBlogPage.jsx';
import AdminReportsPage from '../pages/admin/AdminReportsPage.jsx';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage.jsx';

/**
 * KnowASport Application Router
 */
const router = createBrowserRouter([
  // ── PUBLIC LAYOUT ──────────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      // Core public pages
      { path: '/',                                  element: <HomePage /> },
      { path: '/events',                            element: <EventsPage /> },
      { path: '/events/:slug',                      element: <EventDetailPage /> },
      { path: '/blog',                              element: <BlogListPage /> },
      { path: '/blog/:slug',                        element: <BlogDetailPage /> },

      // Auth pages
      { path: '/login',                             element: <LoginPage /> },
      { path: '/signup',                            element: <SignupPage /> },
      { path: '/forgot-password',                   element: <ForgotPasswordPage /> },

      // User protected pages
      { path: '/events/:slug/register',             element: <ProtectedRoute><RegisterEventPage /></ProtectedRoute> },
      { path: '/payment/:registrationId',           element: <ProtectedRoute><PaymentPage /></ProtectedRoute> },
      { path: '/payment/:registrationId/failed',    element: <ProtectedRoute><PaymentFailedPage /></ProtectedRoute> },
      { path: '/registration/:registrationId/success', element: <ProtectedRoute><RegistrationSuccessPage /></ProtectedRoute> },
      { path: '/my-registrations',                  element: <ProtectedRoute><MyRegistrationsPage /></ProtectedRoute> },
      { path: '/my-registrations/:id',              element: <ProtectedRoute><RegistrationDetailPage /></ProtectedRoute> },
      { path: '/dashboard',                          element: <ProtectedRoute><AthleteDashboardPage /></ProtectedRoute> },
      { path: '/saved',                             element: <ProtectedRoute><SavedEventsPage /></ProtectedRoute> },
      { path: '/notifications',                     element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      { path: '/profile',                           element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },

      // Organizer check-in routes
      { path: '/organizer/check-in',                element: <ProtectedRoute><OrganizerCheckinSelectPage /></ProtectedRoute> },
      { path: '/organizer/events/:eventId/check-in', element: <ProtectedRoute><OrganizerCheckinPage /></ProtectedRoute> },

      // Organizer register & application
      { path: '/organizer/register',                element: <OrganizerRegisterPage /> },
      { path: '/organizer/apply',                   element: <OrganizerRegisterPage /> },

      // 404
      { path: '*',                                  element: <NotFoundPage /> },
    ],
  },

  // ── ORGANIZER LAYOUT ───────────────────────────────────────
  {
    path: '/organizer',
    element: <OrganizerLayout />,
    children: [
      { index: true,                                element: <Navigate to="/organizer/dashboard" replace /> },
      { path: 'dashboard',                          element: <OrganizerDashboardPage /> },
      { path: 'events',                             element: <OrganizerEventsPage /> },
      { path: 'events/create',                      element: <CreateEventPage /> },
      { path: 'events/:id',                         element: <EditEventPage /> },
      { path: 'events/:id/registrations',           element: <ManageRegistrationsPage /> },
      { path: 'events/:id/analytics',               element: <OrganizerEventAnalyticsPage /> },
      { path: 'settings',                           element: <OrganizerSettingsPage /> },
    ],
  },

  // ── ADMIN LOGIN ───────────────────────────────────────────
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },

  // ── ADMIN LAYOUT ───────────────────────────────────────────
  {
    path: '/admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { index: true,                                element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard',                          element: <AdminDashboardPage /> },
      { path: 'organizers',                         element: <AdminOrganizersPage /> },
      { path: 'events',                             element: <AdminEventsPage /> },
      { path: 'users',                              element: <AdminUsersPage /> },
      { path: 'registrations',                      element: <AdminRegistrationsPage /> },
      { path: 'payments',                           element: <AdminPaymentsPage /> },
      { path: 'blog',                               element: <AdminBlogPage /> },
      { path: 'reports',                            element: <AdminReportsPage /> },
      { path: 'audit-logs',                         element: <AdminAuditLogsPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
