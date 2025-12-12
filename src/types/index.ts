export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
  synced: boolean;
}

export interface KaelConfig {
  personality_level: number;
  cloud_enabled: boolean;
  local_core_enabled: boolean;
  auto_sync: boolean;
}

export interface Script {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}
