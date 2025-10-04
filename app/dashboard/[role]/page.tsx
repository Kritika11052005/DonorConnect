'use client';
import { useParams } from 'next/navigation';
import UserDashboard from '@/components/UserDashboard';
import NGODashboard from '@/components/NGODashboard';
import HospitalDashboard from '@/components/HospitalDashboard';
import AdminDashboard from '@/components/AdminDashboard';
export default function DashboardPage() {
  const params = useParams();
  const role = params.role as string;

  if (role === 'donor') {
    return <UserDashboard />;
  }
  
  if (role === 'ngo') {
    return <NGODashboard />;
  }
  
  if (role === 'hospital') {
    return <HospitalDashboard />;
  }
  
  if (role === 'admin') {
    return <AdminDashboard />;
  }
  
  return <div>Invalid role</div>;
}