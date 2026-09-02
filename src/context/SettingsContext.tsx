import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { SystemSettings } from '../types/settings';
import { settingsApi } from '../api/settings';
import { SettingsContext, DEFAULT_SETTINGS_STATE } from './settings-context';
import toast from 'react-hot-toast';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await settingsApi.getSettings();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch {
      // Keep defaults if network/auth fails silently on initialization
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await settingsApi.updateSettings(newSettings);
      setSettings((prev) => ({ ...prev, ...res.data }));
      toast.success(res.message || 'Settings updated successfully!');
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update settings';
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await settingsApi.resetSettings();
      setSettings(res.data);
      toast.success('Settings restored to factory defaults!');
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset settings';
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        currencySymbol: settings.currency_symbol || '₹',
        currencyCode: settings.currency_format || 'INR',
        dateFormat: settings.date_format || 'DD-MMM-YYYY',
        appName: settings.app_name || 'SmartLend Portfolio Manager',
        updateSettings,
        resetSettings,
        reloadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
