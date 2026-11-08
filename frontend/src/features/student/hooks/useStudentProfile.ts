import { useState, useEffect, useCallback } from 'react';
import { StudentProfile } from '../types/student.types';
import { studentApi } from '../services/studentApi';

export const useStudentProfile = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải hồ sơ học sinh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, error, refetch: fetchProfile };
};
