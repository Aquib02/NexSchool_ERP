import { useAuth } from '../context/AuthContext.jsx';

export const usePermission = () => {
  const { hasPermission, hasRole, user } = useAuth();
  return { hasPermission, hasRole, userRole: user?.role?.name };
};

export default usePermission;
