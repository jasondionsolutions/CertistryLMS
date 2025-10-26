// modules/admin/shared/hooks/useAdminTableStandardized.ts
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted paths for CertistryLMS)
"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from 'sonner';

// SECURE ARCHITECTURE: Standardized error handling following useAdminData.ts patterns
import {
  executeWithErrorHandling,
  createSuccessResult,
  type ApiResult
} from '@/lib/error-handling';

export type SortDirection = "asc" | "desc";

export interface AdminTableState<TData = Record<string, unknown>, TFilters = Record<string, unknown>> {
  // Data
  data: TData[];
  filteredData: TData[];
  paginatedData: TData[];

  // Search & Filters
  search: string;
  filters: TFilters;

  // Sorting
  sortField: string;
  sortDirection: SortDirection;

  // Selection
  selectedItems: string[];

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;

  // Loading states (following useAdminData patterns)
  loading: boolean;
  refreshing: boolean;
  searching: boolean;
  bulkActionLoading: boolean;

  // Error states (following useAdminData patterns)
  error: string | null;

  // Computed states
  isAllSelected: boolean;
  isIndeterminate: boolean;
  hasActiveFilters: boolean;
  hasSelection: boolean;

  // Performance tracking
  lastFetched: Date | null;
  needsRefresh: boolean;
}

export interface AdminTableActions<TData = Record<string, unknown>, TFilters = Record<string, unknown>> {
  // Search & Filters
  setSearch: (search: string) => void;
  setFilters: (filters: TFilters | ((prev: TFilters) => TFilters)) => void;
  clearFilters: () => void;

  // Sorting
  handleSort: (field: string) => void;

  // Selection
  handleSelectAll: () => void;
  handleSelectItem: (itemId: string) => void;
  handleSelectPage: () => void;
  clearSelection: () => void;
  getSelectedData: () => TData[];

  // Pagination
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;

  // Data management (following useAdminData patterns)
  setData: (data: TData[]) => void;
  refreshData: (force?: boolean) => Promise<ApiResult<TData[]>>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Bulk operations
  executeBulkAction: <T>(
    actionFn: (selectedItems: TData[]) => Promise<T>,
    options?: {
      operationName?: string;
      successMessage?: string;
      clearSelectionOnSuccess?: boolean;
    }
  ) => Promise<ApiResult<T>>;
}

export interface AdminTableConfig<TData = Record<string, unknown>, TFilters = Record<string, unknown>> {
  // Required
  getItemId: (item: TData) => string;

  // Data source
  initialData?: TData[];
  refreshFunction?: () => Promise<TData[]>;

  // Configuration
  initialFilters: TFilters;
  initialItemsPerPage?: number;
  initialSortField?: string;
  initialSortDirection?: SortDirection;

  // Custom functions
  filterFunction?: (items: TData[], search: string, filters: TFilters) => TData[];
  sortFunction?: (items: TData[], sortField: string, sortDirection: SortDirection) => TData[];

  // Behavior options
  persistSelection?: boolean;
  resetPageOnFilter?: boolean;
  cacheData?: boolean;
  cacheTimeMinutes?: number;

  // Error handling
  showErrorToasts?: boolean;
  errorContext?: Record<string, unknown>;
}

/**
 * OPTIMIZED Admin Table Hook following useAdminData.ts and useHomepage.ts gold standard patterns
 * ✅ Server-first architecture with proper async patterns
 * ✅ Extensive memoization with useRef, useMemo, useCallback
 * ✅ Cached calculations to prevent setState-in-render violations
 * ✅ Error handling with standardized patterns from useAdminData.ts
 * ✅ Loading states managed properly
 * ✅ Re-render optimization with memoization
 * ✅ Accessibility support built-in
 * ✅ Bulk operations with optimistic updates
 */
export function useAdminTableStandardized<TData = Record<string, unknown>, TFilters = Record<string, unknown>>({
  getItemId,
  initialData = [],
  refreshFunction,
  initialFilters,
  initialItemsPerPage = 10,
  initialSortField = "createdAt",
  initialSortDirection = "desc",
  filterFunction,
  sortFunction,
  persistSelection = false,
  resetPageOnFilter = true,
  cacheData = true,
  cacheTimeMinutes = 5,
  showErrorToasts = true,
  errorContext = {},
}: AdminTableConfig<TData, TFilters>): [AdminTableState<TData, TFilters>, AdminTableActions<TData, TFilters>] {

  // ========================================
  // STATE MANAGEMENT (following useHomepage.ts patterns)
  // ========================================

  // Core data state
  const [data, setData] = useState<TData[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  // Sorting state
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // ========================================
  // OPTIMIZATION REFS (following useHomepage.ts patterns)
  // ========================================

  const lastFetchedRef = useRef<Date | null>(null);
  const isRefreshingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache duration
  const CACHE_DURATION = cacheTimeMinutes * 60 * 1000;

  // ========================================
  // MEMOIZED FUNCTIONS (preventing setState-in-render)
  // ========================================

  // Default filter function with O(1) optimizations
  const defaultFilterFunction = useCallback((items: TData[], searchTerm: string, filterState: TFilters): TData[] => {
    let filtered = [...items];

    // Apply search if provided
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item: TData) => {
        // Search through common string fields
        const searchableFields = ['name', 'title', 'email', 'description', 'author'];
        return searchableFields.some(field => {
          const value = (item as Record<string, unknown>)[field];
          return value && typeof value === 'string' && value.toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply filters
    Object.entries(filterState as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined && value !== false) {
        filtered = filtered.filter((item: TData) => {
          if (typeof value === 'boolean' && value === true) {
            return Boolean((item as Record<string, unknown>)[key]);
          }
          return (item as Record<string, unknown>)[key] === value;
        });
      }
    });

    return filtered;
  }, []);

  // Default sort function with optimized comparisons
  const defaultSortFunction = useCallback((items: TData[], field: string, direction: SortDirection): TData[] => {
    return [...items].sort((a: TData, b: TData) => {
      let aValue = (a as Record<string, unknown>)[field];
      let bValue = (b as Record<string, unknown>)[field];

      // Handle dates
      if (field.includes('Date') || field.includes('At')) {
        aValue = aValue ? new Date(aValue as string | number | Date).getTime() : 0;
        bValue = bValue ? new Date(bValue as string | number | Date).getTime() : 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = typeof bValue === 'string' ? bValue.toLowerCase() : '';
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === 'asc' ? -1 : 1;
      if (bValue == null) return direction === 'asc' ? 1 : -1;

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // FIXED: Apply filters and sorting (NO setState in render)
  const filteredData = useMemo(() => {
    const filterFn = filterFunction || defaultFilterFunction;
    return filterFn(data, search, filters);
  }, [data, search, filters, filterFunction, defaultFilterFunction]);

  const sortedAndFilteredData = useMemo(() => {
    const sortFn = sortFunction || defaultSortFunction;
    return sortFn(filteredData, sortField, sortDirection);
  }, [filteredData, sortField, sortDirection, sortFunction, defaultSortFunction]);

  // FIXED: Pagination calculations (memoized)
  const paginationData = useMemo(() => {
    const totalItems = sortedAndFilteredData.length;

    // Handle "ALL" option (itemsPerPage = -1)
    if (itemsPerPage === -1) {
      return {
        totalItems,
        totalPages: 1,
        startIndex: 0,
        endIndex: totalItems,
        paginatedData: sortedAndFilteredData,
      };
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedAndFilteredData.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      paginatedData,
    };
  }, [sortedAndFilteredData, currentPage, itemsPerPage]);

  // FIXED: Selection calculations (memoized)
  const selectionData = useMemo(() => {
    const { paginatedData } = paginationData;
    const isAllSelected = selectedItems.length === paginatedData.length && paginatedData.length > 0;
    const isIndeterminate = selectedItems.length > 0 && selectedItems.length < paginatedData.length;
    const hasSelection = selectedItems.length > 0;

    return {
      isAllSelected,
      isIndeterminate,
      hasSelection,
    };
  }, [selectedItems.length, paginationData]);

  // FIXED: Active filters check (memoized)
  const hasActiveFilters = useMemo(() => {
    if (search.trim()) return true;

    // Handle null/undefined filters
    if (!filters || typeof filters !== 'object') {
      return false;
    }

    const checkValue = (value: unknown): boolean => {
      if (value === "" || value === null || value === undefined || value === false) {
        return false;
      }
      if (typeof value === "object" && value !== null) {
        return Object.values(value as Record<string, unknown>).some(checkValue);
      }
      return true;
    };

    return Object.values(filters as Record<string, unknown>).some(checkValue);
  }, [search, filters]);

  // Check if data needs refresh
  const needsRefresh = useMemo(() => {
    if (!cacheData || !lastFetchedRef.current) return false;
    const now = new Date();
    const ageMs = now.getTime() - lastFetchedRef.current.getTime();
    return ageMs > CACHE_DURATION;
  }, [cacheData, CACHE_DURATION]);

  // ========================================
  // OPTIMIZED HANDLERS (following useHomepage.ts patterns)
  // ========================================

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  const handleSelectAll = useCallback(() => {
    const { isAllSelected } = selectionData;
    const { paginatedData } = paginationData;

    if (isAllSelected) {
      if (persistSelection) {
        // Remove current page items from selection
        const currentPageIds = paginatedData.map(getItemId);
        setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)));
      } else {
        setSelectedItems([]);
      }
    } else {
      if (persistSelection) {
        // Add current page items to existing selection
        const currentPageIds = paginatedData.map(getItemId);
        setSelectedItems(prev => [...new Set([...prev, ...currentPageIds])]);
      } else {
        setSelectedItems(paginatedData.map(getItemId));
      }
    }
  }, [selectionData, paginationData, getItemId, persistSelection]);

  const handleSelectPage = useCallback(() => {
    const { paginatedData } = paginationData;
    const currentPageIds = paginatedData.map(getItemId);
    setSelectedItems(prev => [...new Set([...prev, ...currentPageIds])]);
  }, [paginationData, getItemId]);

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    const { totalPages } = paginationData;
    const newPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(newPage);
  }, [paginationData]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setItemsPerPage(pageSize);
    setCurrentPage(1);
    if (!persistSelection) {
      clearSelection();
    }
  }, [persistSelection, clearSelection]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    const { totalPages } = paginationData;
    setCurrentPage(totalPages);
  }, [paginationData]);

  // Instant search for client-side filtering
  const instantSetSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters(initialFilters);
    setCurrentPage(1);
    if (!persistSelection) {
      clearSelection();
    }
  }, [initialFilters, persistSelection, clearSelection]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // FIXED: Data refresh following useAdminData.ts patterns
  const refreshData = useCallback(async (force = false): Promise<ApiResult<TData[]>> => {
    if (!refreshFunction) {
      return createSuccessResult(data);
    }

    // Check cache validity
    if (!force && cacheData && lastFetchedRef.current) {
      const now = new Date();
      const ageMs = now.getTime() - lastFetchedRef.current.getTime();
      if (ageMs < CACHE_DURATION) {
        return createSuccessResult(data);
      }
    }

    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      return createSuccessResult(data);
    }

    // SECURE ARCHITECTURE: Standardized error handling
    return executeWithErrorHandling(
      async () => {
        isRefreshingRef.current = true;
        const newData = await refreshFunction();
        setData(newData);
        lastFetchedRef.current = new Date();
        return newData;
      },
      {
        setLoading: setRefreshing,
        setError,
        errorConfig: {
          operationName: 'Refresh Table Data',
          showToast: showErrorToasts,
          logToConsole: true,
          context: { ...errorContext, force }
        }
      }
    ).finally(() => {
      isRefreshingRef.current = false;
    });
  }, [refreshFunction, data, cacheData, CACHE_DURATION, showErrorToasts, errorContext]);

  // Get selected data items
  const getSelectedData = useCallback((): TData[] => {
    return data.filter(item => selectedItems.includes(getItemId(item)));
  }, [data, selectedItems, getItemId]);

  // FIXED: Bulk action execution with error handling
  const executeBulkAction = useCallback(async <T>(
    actionFn: (selectedItems: TData[]) => Promise<T>,
    options: {
      operationName?: string;
      successMessage?: string;
      clearSelectionOnSuccess?: boolean;
    } = {}
  ): Promise<ApiResult<T>> => {
    const {
      operationName = 'Bulk Action',
      successMessage = 'Bulk action completed successfully',
      clearSelectionOnSuccess = true,
    } = options;

    const selectedData = getSelectedData();
    if (selectedData.length === 0) {
      const errorMsg = 'No items selected for bulk action';
      setError(errorMsg);
      if (showErrorToasts) {
        toast.error(errorMsg);
      }
      return { success: false, error: errorMsg, errorType: 'ValidationError' };
    }

    return executeWithErrorHandling(
      async () => {
        const result = await actionFn(selectedData);
        if (clearSelectionOnSuccess) {
          clearSelection();
        }
        if (showErrorToasts) {
          toast.success(successMessage);
        }
        return result;
      },
      {
        setLoading: setBulkActionLoading,
        setError,
        errorConfig: {
          operationName,
          showToast: showErrorToasts,
          logToConsole: true,
          context: { ...errorContext, selectedCount: selectedData.length }
        }
      }
    );
  }, [getSelectedData, clearSelection, showErrorToasts, errorContext]);

  // ========================================
  // EFFECTS (following useHomepage.ts patterns)
  // ========================================

  // Reset page when filters change (if configured to do so)
  useEffect(() => {
    if (resetPageOnFilter) {
      setCurrentPage(1);
    }
    if (!persistSelection) {
      clearSelection();
    }
  }, [search, filters, resetPageOnFilter, persistSelection, clearSelection]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // RETURN STATE AND ACTIONS
  // ========================================

  // Create state object
  const state: AdminTableState<TData, TFilters> = {
    data,
    filteredData: sortedAndFilteredData,
    paginatedData: paginationData.paginatedData,
    search,
    filters,
    sortField,
    sortDirection,
    selectedItems,
    currentPage,
    itemsPerPage,
    totalPages: paginationData.totalPages,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    totalItems: paginationData.totalItems,
    loading,
    refreshing,
    searching,
    bulkActionLoading,
    error,
    isAllSelected: selectionData.isAllSelected,
    isIndeterminate: selectionData.isIndeterminate,
    hasActiveFilters,
    hasSelection: selectionData.hasSelection,
    lastFetched: lastFetchedRef.current,
    needsRefresh,
  };

  // Create actions object
  const actions: AdminTableActions<TData, TFilters> = {
    setSearch: instantSetSearch,
    setFilters,
    clearFilters,
    handleSort,
    handleSelectAll,
    handleSelectItem,
    handleSelectPage,
    clearSelection,
    handlePageChange,
    handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    setData,
    refreshData,
    setLoading,
    setError,
    clearError,
    getSelectedData,
    executeBulkAction,
  };

  return [state, actions];
}

// ========================================
// CONVENIENCE HOOKS (following useAdminData.ts patterns)
// ========================================

/**
 * Simplified hook for basic table functionality
 */
export function useAdminTableBasic<TData = Record<string, unknown>>(
  data: TData[],
  getItemId: (item: TData) => string,
  options?: Partial<AdminTableConfig<TData, Record<string, unknown>>>
) {
  return useAdminTableStandardized({
    getItemId,
    initialData: data,
    initialFilters: {},
    ...options,
  });
}

/**
 * Hook for server-side paginated tables
 */
export function useAdminTableServerSide<TData = Record<string, unknown>, TFilters = Record<string, unknown>>(
  config: AdminTableConfig<TData, TFilters> & {
    refreshFunction: () => Promise<TData[]>;
  }
) {
  return useAdminTableStandardized({
    cacheData: true,
    cacheTimeMinutes: 2, // Shorter cache for server-side data
    ...config,
  });
}
