// modules/admin/shared/hooks/index.ts
export { useAdminAuth, type AuthState, type AdminAuthData, type UseAdminAuthReturn } from './useAdminAuth';
export {
  useAdminTableStandardized,
  useAdminTableBasic,
  useAdminTableServerSide,
  type AdminTableState,
  type AdminTableActions,
  type AdminTableConfig,
  type SortDirection
} from './useAdminTableStandardized';
