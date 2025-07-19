import { useAuth } from '@/hooks/useAuth';
import { useView } from '@/hooks/useView';
import { useRoleTesting } from '@/contexts/RoleTestingContext';

export const useEffectiveRole = () => {
  const { profile } = useAuth();
  const { currentView } = useView();
  const { effectiveRole: testRole, isOwner } = useRoleTesting();
  
  // If user is owner/admin and they've toggled to student view, use student role
  const isOwnerOrAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  
  // Determine effective role based on view toggle and role testing
  let effectiveRole: 'student' | 'admin' | 'instructor' | 'owner' = profile?.role || 'student';
  
  // If testing role is active (for role testing context)
  if (isOwner && testRole !== (profile?.role || 'student')) {
    effectiveRole = testRole as 'student' | 'admin' | 'instructor' | 'owner';
  }
  // If owner/admin toggled to student view
  else if (isOwnerOrAdmin && currentView === 'student') {
    effectiveRole = 'student';
  }
  // If owner/admin toggled to admin view
  else if (isOwnerOrAdmin && currentView === 'admin') {
    effectiveRole = profile?.role || 'admin';
  }
  
  return {
    effectiveRole,
    isAdmin: effectiveRole === 'admin' || effectiveRole === 'owner',
    isOwner: profile?.role === 'admin' || profile?.role === 'owner',
    canSwitchView: isOwnerOrAdmin,
    actualRole: profile?.role
  };
};