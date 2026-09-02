import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md text-center p-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-danger-50 text-danger-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-sm text-slate-500 mt-2">
            Your account ({user?.email}) with role{' '}
            <span className="font-semibold text-slate-700 uppercase">{user?.role || 'Guest'}</span> does not
            have permission to access this resource.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Link to="/">
            <Button leftIcon={<Home className="w-4 h-4" />}>Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Unauthorized;
