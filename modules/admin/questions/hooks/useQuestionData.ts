// modules/admin/questions/hooks/useQuestionData.ts
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted exam → certification)
"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getQuestionWithDomainData
  // getQuestionsWithDomainData // TODO: Implement if needed
} from '@/modules/admin/questions/serverActions/question.action';
// import { getCertification } from '@/modules/certifications/serverActions/certification.action'; // TODO: Check if exists
import {
  SerializedQuestionWithDomainData
} from '@/modules/admin/questions/types/question.types';

// SECURE ARCHITECTURE: Standardized error handling
import {
  executeWithErrorHandling,
  type ApiResult
} from '@/lib/error-handling';

export interface SerializedCertification {
  id: string;
  name: string;
  code: string;
  vendorId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseQuestionDataReturn {
  // Loading states
  loading: boolean;

  // Question operations
  loadQuestionWithDomain: (questionId: string) => Promise<ApiResult<SerializedQuestionWithDomainData>>;
  // loadQuestionsWithDomain: () => Promise<ApiResult<SerializedQuestionWithDomainData[]>>; // TODO: Implement if needed
  // loadCertification: (certificationId: string) => Promise<ApiResult<SerializedCertification>>; // TODO: Implement if needed
}

export function useQuestionData(): UseQuestionDataReturn {
  const [loading, setLoading] = useState(false);

  const loadQuestionWithDomain = useCallback(async (questionId: string): Promise<ApiResult<SerializedQuestionWithDomainData>> => {
    return executeWithErrorHandling(
      async () => {
        const questionData = await getQuestionWithDomainData(questionId);

        if (!questionData) {
          throw new Error('Question not found');
        }

        return questionData;
      },
      {
        setLoading,
        errorConfig: {
          operationName: 'Load Question',
          showToast: true,
          logToConsole: true,
          context: { questionId }
        }
      }
    );
  }, []);

  // TODO: Implement if needed
  // const loadQuestionsWithDomain = useCallback(async (): Promise<ApiResult<SerializedQuestionWithDomainData[]>> => {
  //   return executeWithErrorHandling(
  //     async () => {
  //       const result = await getQuestionsWithDomainData();
  //       if (!Array.isArray(result)) {
  //         throw new Error('Failed to load questions');
  //       }
  //       return result;
  //     },
  //     {
  //       setLoading,
  //       errorConfig: {
  //         operationName: 'Load Questions with Domain Data',
  //         showToast: true,
  //         logToConsole: true
  //       }
  //     }
  //   );
  // }, []);

  // TODO: Implement if needed
  // const loadCertification = useCallback(async (certificationId: string): Promise<ApiResult<SerializedCertification>> => {
  //   return executeWithErrorHandling(
  //     async () => {
  //       const certificationResult = await getCertification(certificationId);
  //       if (!certificationResult.success || !certificationResult.data) {
  //         throw new Error(certificationResult.error || 'Certification not found');
  //       }
  //       return certificationResult.data as SerializedCertification;
  //     },
  //     {
  //       errorConfig: {
  //         operationName: 'Load Certification',
  //         showToast: false,
  //         logToConsole: true,
  //         context: { certificationId }
  //       }
  //     }
  //   );
  // }, []);

  return {
    loading,
    loadQuestionWithDomain,
    // loadQuestionsWithDomain, // TODO: Uncomment when implemented
    // loadCertification, // TODO: Uncomment when implemented
  };
}
