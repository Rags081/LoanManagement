import { apiClient } from './client';
import { SystemSettings, SystemInfoData, ChangePasswordDto, SettingsSaveResponse } from '../types/settings';

export const settingsApi = {
  /**
   * Fetch all system preferences & engine defaults
   */
  async getSettings(): Promise<SystemSettings> {
    const res = await apiClient.get<SystemSettings>('/settings');
    return res.data;
  },

  /**
   * Bulk update settings
   */
  async updateSettings(settings: Partial<SystemSettings>): Promise<SettingsSaveResponse> {
    const res = await apiClient.put<SettingsSaveResponse>('/settings', settings);
    return res.data;
  },

  /**
   * Reset all settings to factory defaults
   */
  async resetSettings(): Promise<SettingsSaveResponse> {
    const res = await apiClient.post<SettingsSaveResponse>('/settings/reset');
    return res.data;
  },

  /**
   * Get live database connection metrics and table statistics
   */
  async getSystemInfo(): Promise<SystemInfoData> {
    const res = await apiClient.get<SystemInfoData>('/settings/system-info');
    return res.data;
  },

  /**
   * Change user/admin password
   */
  async changePassword(data: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>('/settings/change-password', data);
    return res.data;
  },

  /**
   * Download full system JSON database backup
   */
  async downloadBackup(): Promise<void> {
    const res = await apiClient.get('/settings/backup', {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default settingsApi;
