
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  originalImage?: string;
}

export enum ImageStyle {
  ORIGINAL = 'Original',
  GHIBLI = 'Studio Ghibli',
  NANO_BANANA = 'Nano Banana',
  RETRO = 'Retro 80s',
  CYBERPUNK = 'Cyberpunk 2077',
  WATERCOLOR = 'Soft Watercolor',
  SKETCH = 'Pencil Sketch',
  POP_ART = 'Pop Art',
  REALISTIC_3D = 'Hyper-Realistic 3D'
}

export interface UserSettings {
  rainbowFont: boolean;
  responseLength: 'concise' | 'detailed';
  accentColor: string;
}

export interface UserProfile {
  id: string;
  username: string;
  settings: UserSettings;
}
