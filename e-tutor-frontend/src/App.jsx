import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import ClassesMarketplace from './pages/ClassesMarketplace';
import TutorsDirectory from './pages/TutorsDirectory';
import Checkout from './pages/Checkout';
import Classroom from './pages/Classroom';
import Diagnostics from './pages/Diagnostics';

// Thành phần bảo vệ Route: Chỉ cho phép truy cập khi đã đăng nhập
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" replace />;
};

// Thành phần bảo vệ Route Admin: Chỉ cho phép ADMIN truy cập
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const storedUser = localStorage.getItem('user');
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(storedUser);
    return user.role === 'ADMIN' ? children : <Navigate to="/dashboard" replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Các Route công khai */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/classes" element={<ClassesMarketplace />} />
        <Route path="/tutors" element={<TutorsDirectory />} />
        <Route path="/diagnostics" element={<Diagnostics />} />

        {/* Các Route bảo mật (Yêu cầu đăng nhập) */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/checkout/:classId" 
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/classroom/:classId/:lessonId" 
          element={
            <PrivateRoute>
              <Classroom />
            </PrivateRoute>
          } 
        />

        {/* Route dành riêng cho Admin */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

        {/* Redirect mặc định */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
