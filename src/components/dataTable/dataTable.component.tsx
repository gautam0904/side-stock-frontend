import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, Box, CircularProgress } from '@mui/material';

interface DataTableProps {
  columns: any[];
  fetchData: (page: number, limit: number) => Promise<{ data: any[] }>;
  itemsPerPage?: number;
  scrollThreshold?: number;
  maxCachedPages?: number;
  actionButtons?: Array<{
    icon: React.ReactNode;
    tooltip: string;
    onClick: (row: any) => void;
    color?: string;
  }>;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  fetchData,
  itemsPerPage = 10,
  scrollThreshold = 0.75,
  maxCachedPages = 2,
  actionButtons = []
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingRequestRef = useRef<Promise<any> | null>(null);

  const loadData = async (pageNum: number) => {
    if (!hasMore || loading) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If there's a pending request for the same page, return it
    if (pendingRequestRef.current && page === pageNum) {
      return pendingRequestRef.current;
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      // Store the promise
      pendingRequestRef.current = fetchData(pageNum, itemsPerPage);
      const response = await pendingRequestRef.current;
      
      const newRows = response.data.map((row: any, index: number) => ({
        ...row,
        id: row._id || row.id,
        no: ((pageNum - 1) * itemsPerPage) + index + 1
      }));

      setRows(prev => {
        const updatedRows = [...prev, ...newRows];
        if (updatedRows.length > itemsPerPage * maxCachedPages) {
          return updatedRows.slice(-itemsPerPage * maxCachedPages);
        }
        return updatedRows;
      });

      setHasMore(newRows.length === itemsPerPage);
      setPage(pageNum);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Ignore abort errors
        return;
      }
      toast.error(error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      pendingRequestRef.current = null;
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    loadData(1);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div>
      {/* Your table rendering logic here */}
    </div>
  );
};

export default DataTable;